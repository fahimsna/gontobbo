import Ride from "../models/Ride.js";

/*
|--------------------------------------------------------------------------
| Create Ride
|--------------------------------------------------------------------------
*/

export const createRide = async (req, res) => {
  try {
    const {
      pickup,
      destination,
      distance,
      duration,
      estimatedFare,
      vehicleType,
    } = req.body;

    if (!pickup || !destination) {
      return res.status(400).json({
        success: false,
        message: "Pickup and destination are required.",
      });
    }

    if (
      pickup.latitude === undefined ||
      pickup.longitude === undefined ||
      destination.latitude === undefined ||
      destination.longitude === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid pickup and destination coordinates are required.",
      });
    }

    const pickupAddress =
      typeof pickup.address === "string"
        ? pickup.address
        : pickup.displayName || pickup.name || "Pickup location";

    const destinationAddress =
      typeof destination.address === "string"
        ? destination.address
        : destination.displayName || destination.name || "Destination";

    const ride = await Ride.create({
      passenger: req.user._id,

      pickup: {
        address: pickupAddress,
        latitude: Number(pickup.latitude),
        longitude: Number(pickup.longitude),
      },

      destination: {
        address: destinationAddress,
        latitude: Number(destination.latitude),
        longitude: Number(destination.longitude),
      },

      distanceKm: Number(distance || 0),

      durationMinutes: Number(duration || 0),

      estimatedFare: Number(estimatedFare || 0),

      vehicleType: vehicleType || "car",

      status: "requested",

      requestedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Ride requested successfully.",
      ride,
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
| Get My Rides
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
| Get Single Ride
|--------------------------------------------------------------------------
*/

export const getRideById = async (req, res) => {
  try {
    const ride = await Ride.findOne({
      _id: req.params.id,
      passenger: req.user._id,
    }).populate("driver", "name email phone");

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
| Cancel Ride
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
    ride.cancellationReason = "Cancelled by passenger";

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
| Get Available Ride Requests
|--------------------------------------------------------------------------
|
| Drivers use this endpoint to see rides that haven't
| been accepted yet.
|
|--------------------------------------------------------------------------
*/

export const getAvailableRides = async (req, res) => {
  try {
    const rides = await Ride.find({
      status: {
        $in: ["requested", "searching"],
      },
      driver: null,
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
| Accept Ride
|--------------------------------------------------------------------------
*/

export const acceptRide = async (req, res) => {
  try {
    const ride = await Ride.findOne({
      _id: req.params.id,

      status: {
        $in: ["requested", "searching"],
      },

      driver: null,
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride is no longer available.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Assign driver
    |--------------------------------------------------------------------------
    */

    ride.driver = req.user._id;

    ride.status = "accepted";

    ride.acceptedAt = new Date();

    await ride.save();

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
| Driver's Active Rides
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
| Driver Arriving
|--------------------------------------------------------------------------
*/

export const markDriverArriving = async (req, res) => {
  try {
    const ride = await Ride.findOne({
      _id: req.params.id,
      driver: req.user._id,
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found.",
      });
    }

    if (ride.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Ride must be accepted first.",
      });
    }

    ride.status = "driver_arriving";

    await ride.save();

    return res.status(200).json({
      success: true,
      message: "Driver is now arriving.",
      ride,
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
| Start Ride
|--------------------------------------------------------------------------
*/

export const startRide = async (req, res) => {
  try {
    const ride = await Ride.findOne({
      _id: req.params.id,
      driver: req.user._id,
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found.",
      });
    }

    if (ride.status !== "driver_arriving") {
      return res.status(400).json({
        success: false,
        message: "Driver must be arriving before starting the ride.",
      });
    }

    ride.status = "in_progress";
    ride.startedAt = new Date();

    await ride.save();

    return res.status(200).json({
      success: true,
      message: "Ride started.",
      ride,
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
| Complete Ride
|--------------------------------------------------------------------------
*/

export const completeRide = async (req, res) => {
  try {
    const ride = await Ride.findOne({
      _id: req.params.id,
      driver: req.user._id,
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found.",
      });
    }

    if (ride.status !== "in_progress") {
      return res.status(400).json({
        success: false,
        message: "Ride is not currently in progress.",
      });
    }

    ride.status = "completed";
    ride.completedAt = new Date();

    await ride.save();

    return res.status(200).json({
      success: true,
      message: "Ride completed successfully.",
      ride,
    });
  } catch (error) {
    console.error("Complete ride error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to complete ride.",
    });
  }
};
