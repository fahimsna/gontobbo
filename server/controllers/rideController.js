import Ride from "../models/Ride.js";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
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
   * If distance is supplied as meters,
   * convert it to kilometres.
   */
  if (body.distance !== undefined) {
    const distance = Number(body.distance);

    if (Number.isFinite(distance)) {
      /*
       * OSRM distance is normally meters.
       */
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

  /*
   * Backwards compatibility.
   */
  if (body.duration !== undefined) {
    const duration = Number(body.duration);

    if (Number.isFinite(duration)) {
      /*
       * OSRM duration is normally seconds.
       */
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

/*
|--------------------------------------------------------------------------
| CREATE RIDE
|--------------------------------------------------------------------------
*/

export const createRide = async (req, res) => {
  try {
    const { pickup, destination, vehicleType } = req.body;

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

    const pickupAddress = getAddressString(pickup, "Pickup location");

    const destinationAddress = getAddressString(destination, "Destination");

    const distanceKm = getDistanceKm(req.body);

    const durationMinutes = getDurationMinutes(req.body);

    /*
     * Bangladesh application safety limit.
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

      vehicleType: vehicleType || "car",

      status: "requested",

      requestedAt: new Date(),
    });

    const populatedRide = await Ride.findById(ride._id)
      .populate("passenger", "name email phone")
      .populate("driver", "name email phone");

    return res.status(201).json({
      success: true,

      message: "Ride requested successfully.",

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
*/

export const getAvailableRides = async (req, res) => {
  try {
    const rides = await Ride.find({
      status: {
        $in: ["requested", "searching"],
      },

      driver: null,

      vehicleType: req.driver?.vehicle?.type,
    })
      .populate("passenger", "name email phone")
      .sort({
        requestedAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: rides.length,
      rides,
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
*/

export const acceptRide = async (req, res) => {
  try {
    /*
     * IMPORTANT:
     *
     * Atomic query.
     *
     * If two drivers click Accept
     * simultaneously, only ONE can
     * match driver: null.
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
        message:
          "This ride has already been accepted or is no longer available.",
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
