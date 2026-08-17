import Ride from "../models/Ride.js";
import Driver from "../models/Driver.js";

/*
|--------------------------------------------------------------------------
| CREATE RIDE REQUEST
|--------------------------------------------------------------------------
*/

export const createRide = async (req, res) => {
  try {
    const { pickup, dropoff, vehicleType } = req.body;

    // ==========================================
    // Validate pickup
    // ==========================================

    if (!pickup || !pickup.address || !pickup.latitude || !pickup.longitude) {
      return res.status(400).json({
        success: false,
        message: "Complete pickup information is required",
      });
    }

    // ==========================================
    // Validate dropoff
    // ==========================================

    if (
      !dropoff ||
      !dropoff.address ||
      !dropoff.latitude ||
      !dropoff.longitude
    ) {
      return res.status(400).json({
        success: false,
        message: "Complete dropoff information is required",
      });
    }

    // ==========================================
    // Validate vehicle
    // ==========================================

    if (!["car", "bike", "cng"].includes(vehicleType)) {
      return res.status(400).json({
        success: false,
        message: "Valid vehicle type is required",
      });
    }

    const pickupLat = Number(pickup.latitude);

    const pickupLng = Number(pickup.longitude);

    const dropoffLat = Number(dropoff.latitude);

    const dropoffLng = Number(dropoff.longitude);

    if (
      Number.isNaN(pickupLat) ||
      Number.isNaN(pickupLng) ||
      Number.isNaN(dropoffLat) ||
      Number.isNaN(dropoffLng)
    ) {
      return res.status(400).json({
        success: false,
        message: "Coordinates must be valid numbers",
      });
    }

    // ==========================================
    // Coordinate validation
    // ==========================================

    if (
      pickupLat < -90 ||
      pickupLat > 90 ||
      dropoffLat < -90 ||
      dropoffLat > 90
    ) {
      return res.status(400).json({
        success: false,
        message: "Latitude must be between -90 and 90",
      });
    }

    if (
      pickupLng < -180 ||
      pickupLng > 180 ||
      dropoffLng < -180 ||
      dropoffLng > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Longitude must be between -180 and 180",
      });
    }

    // ==========================================
    // Check active ride
    // ==========================================

    const activeRide = await Ride.findOne({
      passenger: req.user._id,

      status: {
        $in: ["searching", "accepted", "arrived", "started"],
      },
    });

    if (activeRide) {
      return res.status(409).json({
        success: false,
        message: "You already have an active ride",
        ride: activeRide,
      });
    }

    // ==========================================
    // Find nearby drivers
    // ==========================================

    const nearbyDrivers = await Driver.find({
      status: "approved",

      isAvailable: true,

      "vehicle.type": vehicleType,

      currentLocation: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [pickupLng, pickupLat],
          },

          $maxDistance: 5000,
        },
      },
    })
      .limit(10)
      .select("_id user vehicle currentLocation rating totalRides");

    // ==========================================
    // Create ride
    // ==========================================

    const ride = await Ride.create({
      passenger: req.user._id,

      pickup: {
        address: pickup.address,

        location: {
          type: "Point",

          coordinates: [pickupLng, pickupLat],
        },
      },

      dropoff: {
        address: dropoff.address,

        location: {
          type: "Point",

          coordinates: [dropoffLng, dropoffLat],
        },
      },

      vehicleType,

      status: "searching",
    });

    // ==========================================
    // Populate passenger
    // ==========================================

    await ride.populate("passenger", "name email phone avatar");

    return res.status(201).json({
      success: true,

      message:
        nearbyDrivers.length > 0
          ? "Ride requested. Nearby drivers found."
          : "Ride requested. No nearby drivers are currently available.",

      ride,

      nearbyDrivers: nearbyDrivers.map((driver) => ({
        id: driver._id,

        user: driver.user,

        vehicle: driver.vehicle,

        rating: driver.rating,

        totalRides: driver.totalRides,

        location: driver.currentLocation,
      })),
    });
  } catch (error) {
    console.error("Create ride error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating ride",
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET MY RIDES
|--------------------------------------------------------------------------
*/

export const getMyRides = async (req, res) => {
  try {
    const rides = await Ride.find({
      passenger: req.user._id,
    })
      .populate("driver", "vehicle rating totalRides currentLocation")
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
      message: "Server error while fetching rides",
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET SINGLE RIDE
|--------------------------------------------------------------------------
*/

export const getRideById = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate("passenger", "name email phone avatar")
      .populate("driver", "user vehicle rating totalRides currentLocation");

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    /*
     * Only passenger or assigned driver
     * should be able to see the ride.
     */

    const isPassenger =
      ride.passenger?._id.toString() === req.user._id.toString();

    const isDriver = ride.driver?.user?.toString() === req.user._id.toString();

    if (!isPassenger && !isDriver && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this ride",
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
      message: "Server error while fetching ride",
    });
  }
};

/*
|--------------------------------------------------------------------------
| CANCEL RIDE
|--------------------------------------------------------------------------
*/

export const cancelRide = async (req, res) => {
  try {
    const { reason } = req.body;

    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    if (ride.passenger.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the passenger can cancel this ride",
      });
    }

    if (!["searching", "accepted"].includes(ride.status)) {
      return res.status(400).json({
        success: false,
        message: "This ride can no longer be cancelled",
      });
    }

    ride.status = "cancelled";

    ride.cancelledAt = new Date();

    ride.cancellationReason = reason?.trim() || "Cancelled by passenger";

    /*
     * If a driver had already accepted,
     * make that driver available again.
     */

    if (ride.driver) {
      await Driver.findByIdAndUpdate(ride.driver, {
        isAvailable: true,
      });
    }

    await ride.save();

    return res.status(200).json({
      success: true,
      message: "Ride cancelled successfully",
      ride,
    });
  } catch (error) {
    console.error("Cancel ride error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while cancelling ride",
    });
  }
};
