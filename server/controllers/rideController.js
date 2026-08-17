import Ride from "../models/Ride.js";
import Driver from "../models/Driver.js";

const calculateFare = (distance, vehicleType) => {
  const baseFare = {
    bike: 40,
    cng: 60,
    car: 100,
  };

  const perKm = {
    bike: 12,
    cng: 18,
    car: 25,
  };

  return Math.round(baseFare[vehicleType] + distance * perKm[vehicleType]);
};

export const requestRide = async (req, res) => {
  try {
    const { pickup, destination, vehicleType, distance, estimatedDuration } =
      req.body;

    if (!pickup || !destination || !vehicleType || distance === undefined) {
      return res.status(400).json({
        success: false,
        message: "Pickup, destination, vehicle type and distance are required",
      });
    }

    if (!["car", "bike", "cng"].includes(vehicleType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle type",
      });
    }

    if (distance <= 0) {
      return res.status(400).json({
        success: false,
        message: "Distance must be greater than zero",
      });
    }

    const estimatedFare = calculateFare(distance, vehicleType);

    const ride = await Ride.create({
      passenger: req.user._id,

      pickup: {
        address: pickup.address,
        latitude: pickup.latitude,
        longitude: pickup.longitude,
      },

      destination: {
        address: destination.address,
        latitude: destination.latitude,
        longitude: destination.longitude,
      },

      vehicleType,

      distance,

      estimatedDuration: estimatedDuration || 0,

      estimatedFare,

      status: "searching",
    });

    const populatedRide = await Ride.findById(ride._id).populate(
      "passenger",
      "name email phone avatar",
    );

    return res.status(201).json({
      success: true,
      message: "Ride requested successfully",
      ride: populatedRide,
    });
  } catch (error) {
    console.error("Request ride error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while requesting ride",
    });
  }
};

export const getMyRides = async (req, res) => {
  try {
    const rides = await Ride.find({
      passenger: req.user._id,
    })
      .populate("driver", "vehicle status rating totalRides")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: rides.length,
      rides,
    });
  } catch (error) {
    console.error("Get rides error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching rides",
    });
  }
};

export const getRideById = async (req, res) => {
  try {
    const { id } = req.params;

    const ride = await Ride.findById(id)
      .populate("passenger", "name email phone avatar")
      .populate("driver", "user vehicle status rating totalRides");

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    // Passenger can only see their own ride
    if (ride.passenger._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this ride",
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

export const cancelRide = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const ride = await Ride.findById(id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    if (ride.passenger.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own rides",
      });
    }

    const cancellableStatuses = [
      "requested",
      "searching",
      "accepted",
      "driver_arriving",
      "driver_arrived",
    ];

    if (!cancellableStatuses.includes(ride.status)) {
      return res.status(400).json({
        success: false,
        message: "This ride can no longer be cancelled",
      });
    }

    ride.status = "cancelled";
    ride.cancellationReason = reason?.trim() || "Cancelled by passenger";
    ride.cancelledBy = "passenger";
    ride.cancelledAt = new Date();

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
