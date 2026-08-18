import Ride from "../models/Ride.js";
import Driver from "../models/Driver.js";

/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

/*
 * Maximum distance between a driver's current GPS position
 * and a passenger pickup location for that ride to appear.
 *
 * 10 km is a reasonable starting point for the Gontobbo MVP.
 */
const DRIVER_MATCH_RADIUS_KM = 10;

/*
 * A driver's GPS location is considered stale after this amount
 * of time.
 *
 * This prevents a driver who closed the app hours ago from
 * appearing as an active nearby driver.
 */
const DRIVER_LOCATION_MAX_AGE_MS = 5 * 60 * 1000;

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

/*
 * Convert a location object into a displayable address string.
 */
const getAddressString = (location, fallback) => {
  if (!location) {
    return fallback;
  }

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

/*
|--------------------------------------------------------------------------
| COORDINATES
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| DRIVER GEOJSON COORDINATES
|--------------------------------------------------------------------------
|
| Driver.currentLocation is stored as:
|
| {
|   type: "Point",
|   coordinates: [longitude, latitude],
|   updatedAt: Date
| }
|
|--------------------------------------------------------------------------
*/

const getDriverCoordinates = (driver) => {
  const location = driver?.currentLocation;

  if (!location) {
    return null;
  }

  if (location.type !== "Point") {
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

/*
|--------------------------------------------------------------------------
| LOCATION FRESHNESS
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| HAVERSINE DISTANCE
|--------------------------------------------------------------------------
|
| Returns distance in kilometres between two GPS coordinates.
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| DRIVER -> RIDE DISTANCE
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| ROUTE DISTANCE
|--------------------------------------------------------------------------
*/

const getDistanceKm = (body) => {
  if (body.distanceKm !== undefined) {
    return Number(body.distanceKm);
  }

  if (body.route?.distanceKm !== undefined) {
    return Number(body.route.distanceKm);
  }

  /*
   * Backwards compatibility.
   *
   * OSRM normally returns meters.
   */
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

/*
|--------------------------------------------------------------------------
| ROUTE DURATION
|--------------------------------------------------------------------------
*/

const getDurationMinutes = (body) => {
  if (body.durationMinutes !== undefined) {
    return Number(body.durationMinutes);
  }

  if (body.route?.durationMinutes !== undefined) {
    return Number(body.route.durationMinutes);
  }

  /*
   * Backwards compatibility.
   *
   * OSRM normally returns seconds.
   */
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

/*
|--------------------------------------------------------------------------
| FARE
|--------------------------------------------------------------------------
*/

const calculateServerFare = (distanceKm) => {
  const BASE_FARE = 50;

  const PRICE_PER_KM = 20;

  const rawFare = BASE_FARE + distanceKm * PRICE_PER_KM;

  return Math.max(50, Math.ceil(rawFare / 10) * 10);
};

/*
|--------------------------------------------------------------------------
| CREATE RIDE
|--------------------------------------------------------------------------
*/

export const createRide = async (req, res) => {
  try {
    const { pickup, destination, vehicleType } = req.body;

    /*
     * Prevent a passenger from creating
     * multiple active rides.
     */
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

    /*
     * Extract coordinates.
     */
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

    /*
     * Normalize vehicle type.
     */
    const normalizedVehicleType = ["car", "bike", "cng"].includes(vehicleType)
      ? vehicleType
      : "car";

    const pickupAddress = getAddressString(pickup, "Pickup location");

    const destinationAddress = getAddressString(destination, "Destination");

    const distanceKm = getDistanceKm(req.body);

    const durationMinutes = getDurationMinutes(req.body);

    /*
     * Safety limit.
     */
    if (!Number.isFinite(distanceKm) || distanceKm <= 0 || distanceKm > 200) {
      return res.status(400).json({
        success: false,

        message: "Invalid route distance.",
      });
    }

    if (
      !Number.isFinite(durationMinutes) ||
      durationMinutes <= 0 ||
      durationMinutes > 600
    ) {
      return res.status(400).json({
        success: false,

        message: "Invalid route duration.",
      });
    }

    const estimatedFare = calculateServerFare(distanceKm);

    /*
     * New rides start in "searching".
     *
     * This tells the passenger UI that the
     * system is actively looking for a driver.
     */
    const ride = await Ride.create({
      passenger: req.user._id,

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

      distanceKm: Number(distanceKm.toFixed(2)),

      durationMinutes: Number(durationMinutes.toFixed(1)),

      estimatedFare,

      vehicleType: normalizedVehicleType,

      status: "searching",

      requestedAt: new Date(),
    });

    const populatedRide = await Ride.findById(ride._id)
      .populate("passenger", "name email phone")
      .populate("driver", "name email phone");

    return res.status(201).json({
      success: true,

      message: "Ride requested successfully. Searching for a nearby driver.",

      ride: populatedRide,
    });
  } catch (error) {
    console.error("Create ride error:", error);

    return res.status(500).json({
      success: false,

      message: error.message || "Failed to create ride request.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| PASSENGER - MY RIDES
|--------------------------------------------------------------------------
*/

export const getMyRides = async (req, res) => {
  try {
    const rides = await Ride.find({
      passenger: req.user._id,
    })
      .populate("driver", "name email phone")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,

      count: rides.length,

      rides,
    });
  } catch (error) {
    console.error("Get my rides error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to fetch rides.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| PASSENGER - ACTIVE RIDE
|--------------------------------------------------------------------------
*/

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
      .populate("passenger", "name email phone")
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

/*
|--------------------------------------------------------------------------
| SINGLE RIDE
|--------------------------------------------------------------------------
*/

export const getRideById = async (req, res) => {
  try {
    const ride = await Ride.findOne({
      _id: req.params.id,

      passenger: req.user._id,
    })
      .populate("passenger", "name email phone")
      .populate("driver", "name email phone");

    if (!ride) {
      return res.status(404).json({
        success: false,

        message: "Ride not found.",
      });
    }

    return res.status(200).json({
      success: true,

      ride,
    });
  } catch (error) {
    console.error("Get ride error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to fetch ride.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| PASSENGER - CANCEL
|--------------------------------------------------------------------------
*/

export const cancelRide = async (req, res) => {
  try {
    const ride = await Ride.findOne({
      _id: req.params.id,

      passenger: req.user._id,
    });

    if (!ride) {
      return res.status(404).json({
        success: false,

        message: "Ride not found.",
      });
    }

    if (!["requested", "searching"].includes(ride.status)) {
      return res.status(400).json({
        success: false,

        message: "This ride cannot be cancelled now.",
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

/*
|--------------------------------------------------------------------------
| DRIVER - AVAILABLE RIDES
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| This is now driver-specific.
|
| A driver only sees:
|
| 1. Approved driver
| 2. Currently online
| 3. Has a fresh GPS location
| 4. Matching vehicle type
| 5. Pickup is within 10 km
|
|--------------------------------------------------------------------------
*/

export const getAvailableRides = async (req, res) => {
  try {
    const driver = req.driver;

    /*
     * The driver middleware already checks
     * approval status.
     *
     * But an approved driver still needs
     * to explicitly be online.
     */
    if (!driver?.isAvailable) {
      return res.status(200).json({
        success: true,

        count: 0,

        rides: [],
      });
    }

    /*
     * Driver must have GPS.
     */
    const driverCoordinates = getDriverCoordinates(driver);

    if (!driverCoordinates) {
      return res.status(200).json({
        success: true,

        count: 0,

        rides: [],
      });
    }

    /*
     * GPS must be recent.
     */
    if (!isDriverLocationFresh(driver)) {
      return res.status(200).json({
        success: true,

        count: 0,

        rides: [],
      });
    }

    /*
     * First filter by status and vehicle.
     *
     * Then apply GPS distance in JavaScript.
     *
     * This is intentionally simple and reliable
     * for the current MVP.
     */
    const candidateRides = await Ride.find({
      status: {
        $in: ["requested", "searching"],
      },

      driver: null,

      vehicleType: driver.vehicle?.type,
    })
      .populate("passenger", "name email phone")
      .sort({
        requestedAt: -1,
      })
      .limit(100);

    /*
     * Only rides close to this driver.
     */
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
        /*
         * Add a non-persistent field so the
         * frontend can show how far the driver
         * is from pickup.
         */
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

/*
|--------------------------------------------------------------------------
| DRIVER - ACCEPT RIDE
|--------------------------------------------------------------------------
|
| Acceptance is checked again on the server.
|
| This protects against:
|
| - stale frontend data
| - driver going offline
| - driver moving too far away
| - two drivers accepting simultaneously
|
|--------------------------------------------------------------------------
*/

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

    /*
     * Load the ride first so we can verify
     * driver-to-pickup distance.
     */
    const currentRide = await Ride.findOne({
      _id: req.params.id,

      status: {
        $in: ["requested", "searching"],
      },

      driver: null,
    });

    if (!currentRide) {
      return res.status(409).json({
        success: false,

        message:
          "This ride has already been accepted or is no longer available.",
      });
    }

    /*
     * Vehicle type must still match.
     */
    if (currentRide.vehicleType !== driver.vehicle?.type) {
      return res.status(409).json({
        success: false,

        message: "This ride requires a different vehicle type.",
      });
    }

    /*
     * Driver must still be reasonably close
     * to the passenger pickup.
     */
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

    /*
     * ATOMIC ACCEPTANCE
     *
     * This is extremely important.
     *
     * If Driver A and Driver B click Accept
     * at exactly the same time, MongoDB allows
     * only one update because driver must still
     * be null.
     */
    const ride = await Ride.findOneAndUpdate(
      {
        _id: req.params.id,

        status: {
          $in: ["requested", "searching"],
        },

        driver: null,
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

    /*
     * Get populated result.
     */
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

/*
|--------------------------------------------------------------------------
| DRIVER - MY ACTIVE RIDES
|--------------------------------------------------------------------------
*/

export const getDriverRides = async (req, res) => {
  try {
    const rides = await Ride.find({
      driver: req.user._id,

      status: {
        $in: ["accepted", "driver_arriving", "in_progress"],
      },
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

/*
|--------------------------------------------------------------------------
| DRIVER - ARRIVING
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| DRIVER - START RIDE
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| DRIVER - COMPLETE RIDE
|--------------------------------------------------------------------------
*/

export const completeRide = async (req, res) => {
  try {
    /*
     * Complete the ride atomically.
     */
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

    /*
     * Increment driver's completed ride count.
     *
     * Do NOT take the driver offline.
     *
     * An online driver can immediately receive
     * another request.
     */
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
