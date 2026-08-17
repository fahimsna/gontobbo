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

    // ----------------------------------------------------
    // Validate pickup and destination
    // ----------------------------------------------------

    if (!pickup || !destination) {
      return res.status(400).json({
        success: false,
        message: "Pickup and destination are required.",
      });
    }

    // ----------------------------------------------------
    // Validate coordinates
    // ----------------------------------------------------

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

    // ----------------------------------------------------
    // Build readable addresses
    // ----------------------------------------------------

    const pickupAddress =
      typeof pickup.address === "string"
        ? pickup.address
        : pickup.displayName || pickup.name || "Pickup location";

    const destinationAddress =
      typeof destination.address === "string"
        ? destination.address
        : destination.displayName || destination.name || "Destination";

    // ----------------------------------------------------
    // Validate route information
    // ----------------------------------------------------

    const distanceKm = Number(distance || 0);

    const durationMinutes = Number(duration || 0);

    const fare = Number(estimatedFare || 0);

    // ----------------------------------------------------
    // Create ride
    // ----------------------------------------------------

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

      distanceKm,

      durationMinutes,

      estimatedFare: fare,

      vehicleType: vehicleType || "car",

      status: "requested",

      requestedAt: new Date(),
    });

    // ----------------------------------------------------
    // Response
    // ----------------------------------------------------

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

    // ----------------------------------------------------
    // Only requested/searching rides
    // can be cancelled by passenger
    // ----------------------------------------------------

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
