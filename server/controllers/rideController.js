import Ride from "../models/Ride.js";
import Driver from "../models/Driver.js";

const DRIVER_MATCH_RADIUS_KM = 10;
const DRIVER_LOCATION_MAX_AGE_MS = 5 * 60 * 1000;

const getAddressString = (location, fallback) => {
  if (!location) return fallback;

  if (typeof location.address === "string") {
    return location.address;
  }

  if (typeof location.displayName === "string") {
    return location.displayName;
  }

  if (typeof location.name === "string") {
    return location.name;
  }

  if (typeof location.address === "object") {
    const address = location.address;

    const parts = [
      address.road,
      address.house_number,
      address.neighbourhood,
      address.suburb,
      address.city_district,
      address.city,
      address.town,
      address.village,
      address.state_district,
      address.state,
      address.postcode,
      address.country,
    ].filter(Boolean);

    if (parts.length > 0) {
      return [...new Set(parts)].join(", ");
    }
  }

  return fallback;
};

const getCoordinates = (location) => {
  if (!location) {
    return {
      latitude: null,
      longitude: null,
    };
  }

  return {
    latitude: Number(
      location.latitude ??
        location.lat ??
        location.coordinates?.latitude ??
        location.coordinates?.lat,
    ),
    longitude: Number(
      location.longitude ??
        location.lon ??
        location.lng ??
        location.coordinates?.longitude ??
        location.coordinates?.lng,
    ),
  };
};

const getDriverCoordinates = (driver) => {
  const location = driver?.currentLocation;

  if (!location || location.type !== "Point") {
    return null;
  }

  const coordinates = Array.isArray(location.coordinates)
    ? location.coordinates
    : null;

  if (!coordinates || coordinates.length < 2) {
    return null;
  }

  const longitude = Number(coordinates[0]);
  const latitude = Number(coordinates[1]);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
};

const isDriverLocationFresh = (driver) => {
  const updatedAt = driver?.currentLocation?.updatedAt;

  if (!updatedAt) {
    return false;
  }

  const updatedTime = new Date(updatedAt).getTime();

  if (!Number.isFinite(updatedTime)) {
    return false;
  }

  return Date.now() - updatedTime <= DRIVER_LOCATION_MAX_AGE_MS;
};

const calculateDistanceKm = (latitude1, longitude1, latitude2, longitude2) => {
  const earthRadiusKm = 6371;

  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const lat1 = toRadians(latitude1);
  const lat2 = toRadians(latitude2);

  const deltaLat = toRadians(latitude2 - latitude1);

  const deltaLng = toRadians(longitude2 - longitude1);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
};

const getDriverToRideDistanceKm = (driver, ride) => {
  const driverLocation = getDriverCoordinates(driver);

  if (!driverLocation) {
    return null;
  }

  const pickupLatitude = Number(ride.pickup?.latitude);

  const pickupLongitude = Number(ride.pickup?.longitude);

  if (!Number.isFinite(pickupLatitude) || !Number.isFinite(pickupLongitude)) {
    return null;
  }

  return calculateDistanceKm(
    driverLocation.latitude,
    driverLocation.longitude,
    pickupLatitude,
    pickupLongitude,
  );
};

const getDistanceKm = (body) => {
  if (body.distanceKm !== undefined) {
    return Number(body.distanceKm);
  }

  if (body.route?.distanceKm !== undefined) {
    return Number(body.route.distanceKm);
  }

  if (body.distance !== undefined) {
    const distance = Number(body.distance);

    if (Number.isFinite(distance)) {
      return distance > 200 ? distance / 1000 : distance;
    }
  }

  if (body.route?.distance !== undefined) {
    const distance = Number(body.route.distance);

    if (Number.isFinite(distance)) {
      return distance > 200 ? distance / 1000 : distance;
    }
  }

  return 0;
};

const getDurationMinutes = (body) => {
  if (body.durationMinutes !== undefined) {
    return Number(body.durationMinutes);
  }

  if (body.route?.durationMinutes !== undefined) {
    return Number(body.route.durationMinutes);
  }

  if (body.duration !== undefined) {
    const duration = Number(body.duration);

    if (Number.isFinite(duration)) {
      return duration > 600 ? duration / 60 : duration;
    }
  }

  if (body.route?.duration !== undefined) {
    const duration = Number(body.route.duration);

    if (Number.isFinite(duration)) {
      return duration > 600 ? duration / 60 : duration;
    }
  }

  return 0;
};

const calculateServerFare = (distanceKm) => {
  const BASE_FARE = 50;
  const PRICE_PER_KM = 20;

  const rawFare = BASE_FARE + distanceKm * PRICE_PER_KM;

  return Math.max(50, Math.ceil(rawFare / 10) * 10);
};

export const createRide = async (req, res) => {
  try {
    const { pickup, destination, vehicleType } = req.body;

    const existingRide = await Ride.findOne({
      passenger: req.user._id,
      status: {
        $in: [
          "requested",
          "searching",
          "accepted",
          "driver_arriving",
          "in_progress",
        ],
      },
    });

    if (existingRide) {
      return res.status(409).json({
        success: false,
        message: "You already have an active ride.",
        ride: existingRide,
      });
    }

    if (!pickup || !destination) {
      return res.status(400).json({
        success: false,
        message: "Pickup and destination are required.",
      });
    }

    const pickupCoordinates = getCoordinates(pickup);

    const destinationCoordinates = getCoordinates(destination);

    if (
      !Number.isFinite(pickupCoordinates.latitude) ||
      !Number.isFinite(pickupCoordinates.longitude) ||
      !Number.isFinite(destinationCoordinates.latitude) ||
      !Number.isFinite(destinationCoordinates.longitude)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid pickup and destination coordinates are required.",
      });
    }

    const normalizedVehicleType = ["car", "bike", "cng"].includes(vehicleType)
      ? vehicleType
      : "car";

    const pickupAddress = getAddressString(pickup, "Pickup location");

    const destinationAddress = getAddressString(destination, "Destination");

    const distanceKm = getDistanceKm(req.body);

    const durationMinutes = getDurationMinutes(req.body);

    if (!Number.isFinite(distanceKm) || distanceKm <= 0 || distanceKm > 200) {
      return res.status(400).json({
        success: false,
        message: "Invalid route distance.",
      });
    }

    if (
      !Number.isFinite(durationMinutes) ||
      durationMinutes <= 0 ||
      durationMinutes > 24 * 60
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid route duration.",
      });
    }

    const estimatedFare = calculateServerFare(distanceKm);

    const ride = await Ride.create({
      passenger: req.user._id,

      driver: null,

      rejectedDrivers: [],

      pickup: {
        address: pickupAddress,
        latitude: pickupCoordinates.latitude,
        longitude: pickupCoordinates.longitude,
      },

      destination: {
        address: destinationAddress,
        latitude: destinationCoordinates.latitude,
        longitude: destinationCoordinates.longitude,
      },

      distanceKm,

      durationMinutes,

      estimatedFare,

      vehicleType: normalizedVehicleType,

      status: "searching",

      requestedAt: new Date(),
    });

    const populatedRide = await Ride.findById(ride._id).populate(
      "passenger",
      "name email phone",
    );

    return res.status(201).json({
      success: true,
      message: "Ride request created successfully.",
      ride: populatedRide,
    });
  } catch (error) {
    console.error("Create ride error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create ride.",
    });
  }
};

export const getMyRides = async (req, res) => {
  try {
    const rides = await Ride.find({
      passenger: req.user._id,
    })
      .populate("driver", "name email phone")
      .sort({
        createdAt: -1,
      })
      .limit(100);

    return res.status(200).json({
      success: true,
      count: rides.length,
      rides,
    });
  } catch (error) {
    console.error("Get my rides error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch ride history.",
    });
  }
};

export const getActiveRide = async (req, res) => {
  try {
    const ride = await Ride.findOne({
      passenger: req.user._id,
      status: {
        $in: [
          "requested",
          "searching",
          "accepted",
          "driver_arriving",
          "in_progress",
        ],
      },
    })
      .populate("driver", "name email phone")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      ride: ride || null,
    });
  } catch (error) {
    console.error("Get active ride error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch active ride.",
    });
  }
};

export const getRideById = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate("passenger", "name email phone")
      .populate("driver", "name email phone");

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found.",
      });
    }

    const isPassenger =
      ride.passenger?._id?.toString() === req.user._id.toString();

    const isDriver = ride.driver?._id?.toString() === req.user._id.toString();

    if (!isPassenger && !isDriver) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this ride.",
      });
    }

    return res.status(200).json({
      success: true,
      ride,
    });
  } catch (error) {
    console.error("Get ride by id error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch ride.",
    });
  }
};

export const cancelRide = async (req, res) => {
  try {
    const ride = await Ride.findOne({
      _id: req.params.id,

      passenger: req.user._id,

      status: {
        $in: [
          "requested",
          "searching",
          "accepted",
          "driver_arriving",
          "in_progress",
        ],
      },
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found or cannot be cancelled.",
      });
    }

    ride.status = "cancelled";

    ride.cancelledAt = new Date();

    ride.cancellationReason = req.body.reason || "Cancelled by passenger";

    await ride.save();

    return res.status(200).json({
      success: true,
      message: "Ride cancelled successfully.",
      ride,
    });
  } catch (error) {
    console.error("Cancel ride error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel ride.",
    });
  }
};

export const getAvailableRides = async (req, res) => {
  try {
    const driver = req.driver;

    if (!driver?.isAvailable) {
      return res.status(200).json({
        success: true,
        count: 0,
        rides: [],
      });
    }

    const driverCoordinates = getDriverCoordinates(driver);

    if (!driverCoordinates) {
      return res.status(200).json({
        success: true,
        count: 0,
        rides: [],
      });
    }

    if (!isDriverLocationFresh(driver)) {
      return res.status(200).json({
        success: true,
        count: 0,
        rides: [],
      });
    }

    const candidateRides = await Ride.find({
      status: {
        $in: ["requested", "searching"],
      },

      driver: null,

      vehicleType: driver.vehicle?.type,

      rejectedDrivers: {
        $ne: req.user._id,
      },
    })
      .populate("passenger", "name email phone")
      .sort({
        requestedAt: -1,
      })
      .limit(100);

    const rides = candidateRides
      .map((ride) => {
        const distance = getDriverToRideDistanceKm(driver, ride);

        if (distance === null) {
          return null;
        }

        return {
          ride,
          driverDistanceKm: Number(distance.toFixed(2)),
        };
      })
      .filter((item) => item && item.driverDistanceKm <= DRIVER_MATCH_RADIUS_KM)
      .sort((a, b) => a.driverDistanceKm - b.driverDistanceKm)
      .map((item) => {
        const rideObject = item.ride.toObject();

        rideObject.driverDistanceKm = item.driverDistanceKm;

        return rideObject;
      });

    return res.status(200).json({
      success: true,
      count: rides.length,
      rides,
      matchingRadiusKm: DRIVER_MATCH_RADIUS_KM,
    });
  } catch (error) {
    console.error("Get available rides error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch available rides.",
    });
  }
};

export const acceptRide = async (req, res) => {
  try {
    const driver = req.driver;

    if (!driver?.isAvailable) {
      return res.status(403).json({
        success: false,
        message: "You must be online to accept a ride.",
      });
    }

    if (!isDriverLocationFresh(driver)) {
      return res.status(403).json({
        success: false,
        message:
          "Your GPS location is out of date. Please keep location sharing enabled.",
      });
    }

    const currentRide = await Ride.findOne({
      _id: req.params.id,

      status: {
        $in: ["requested", "searching"],
      },

      driver: null,

      rejectedDrivers: {
        $ne: req.user._id,
      },
    });

    if (!currentRide) {
      return res.status(409).json({
        success: false,
        message:
          "This ride has already been accepted or is no longer available.",
      });
    }

    if (currentRide.vehicleType !== driver.vehicle?.type) {
      return res.status(409).json({
        success: false,
        message: "This ride requires a different vehicle type.",
      });
    }

    const distanceToPickup = getDriverToRideDistanceKm(driver, currentRide);

    if (
      distanceToPickup === null ||
      distanceToPickup > DRIVER_MATCH_RADIUS_KM
    ) {
      return res.status(409).json({
        success: false,
        message: "You are too far from this passenger to accept the ride.",
      });
    }

    const ride = await Ride.findOneAndUpdate(
      {
        _id: req.params.id,

        status: {
          $in: ["requested", "searching"],
        },

        driver: null,

        rejectedDrivers: {
          $ne: req.user._id,
        },
      },

      {
        $set: {
          driver: req.user._id,

          status: "accepted",

          acceptedAt: new Date(),
        },
      },

      {
        new: true,
      },
    );

    if (!ride) {
      return res.status(409).json({
        success: false,
        message: "This ride was just accepted by another driver.",
      });
    }

    const populatedRide = await Ride.findById(ride._id)
      .populate("passenger", "name email phone")
      .populate("driver", "name email phone");

    return res.status(200).json({
      success: true,
      message: "Ride accepted successfully.",
      ride: populatedRide,
    });
  } catch (error) {
    console.error("Accept ride error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to accept ride.",
    });
  }
};

export const rejectRide = async (req, res) => {
  try {
    const ride = await Ride.findOneAndUpdate(
      {
        _id: req.params.id,

        status: {
          $in: ["requested", "searching"],
        },

        driver: null,

        rejectedDrivers: {
          $ne: req.user._id,
        },
      },

      {
        $addToSet: {
          rejectedDrivers: req.user._id,
        },
      },

      {
        new: true,
      },
    );

    if (!ride) {
      return res.status(409).json({
        success: false,
        message: "This ride is no longer available.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ride request rejected.",
      rideId: ride._id,
    });
  } catch (error) {
    console.error("Reject ride error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reject ride.",
    });
  }
};

export const getDriverRides = async (req, res) => {
  try {
    const rides = await Ride.find({
      driver: req.user._id,
    })
      .populate("passenger", "name email phone")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: rides.length,
      rides,
    });
  } catch (error) {
    console.error("Get driver rides error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch driver rides.",
    });
  }
};

export const markDriverArriving = async (req, res) => {
  try {
    const ride = await Ride.findOneAndUpdate(
      {
        _id: req.params.id,

        driver: req.user._id,

        status: "accepted",
      },

      {
        $set: {
          status: "driver_arriving",
        },
      },

      {
        new: true,
      },
    );

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found or cannot be updated.",
      });
    }

    const populatedRide = await Ride.findById(ride._id)
      .populate("passenger", "name email phone")
      .populate("driver", "name email phone");

    return res.status(200).json({
      success: true,
      message: "Driver is now arriving.",
      ride: populatedRide,
    });
  } catch (error) {
    console.error("Driver arriving error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update ride status.",
    });
  }
};

export const startRide = async (req, res) => {
  try {
    const ride = await Ride.findOneAndUpdate(
      {
        _id: req.params.id,

        driver: req.user._id,

        status: "driver_arriving",
      },

      {
        $set: {
          status: "in_progress",

          startedAt: new Date(),
        },
      },

      {
        new: true,
      },
    );

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found or cannot be started.",
      });
    }

    const populatedRide = await Ride.findById(ride._id)
      .populate("passenger", "name email phone")
      .populate("driver", "name email phone");

    return res.status(200).json({
      success: true,
      message: "Ride started.",
      ride: populatedRide,
    });
  } catch (error) {
    console.error("Start ride error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to start ride.",
    });
  }
};

export const completeRide = async (req, res) => {
  try {
    const ride = await Ride.findOneAndUpdate(
      {
        _id: req.params.id,

        driver: req.user._id,

        status: "in_progress",
      },

      {
        $set: {
          status: "completed",

          completedAt: new Date(),
        },
      },

      {
        new: true,
      },
    );

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found or cannot be completed.",
      });
    }

    await Driver.updateOne(
      {
        user: req.user._id,
      },

      {
        $inc: {
          totalRides: 1,
        },
      },
    );

    const populatedRide = await Ride.findById(ride._id)
      .populate("passenger", "name email phone")
      .populate("driver", "name email phone");

    return res.status(200).json({
      success: true,
      message: "Ride completed successfully.",
      ride: populatedRide,
    });
  } catch (error) {
    console.error("Complete ride error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to complete ride.",
    });
  }
};
