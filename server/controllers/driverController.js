import Driver from "../models/Driver.js";
import User from "../models/User.js";

export const applyAsDriver = async (req, res) => {
  try {
    const { licenseNumber, licenseExpiry, vehicle } = req.body;

    if (!licenseNumber || !licenseExpiry || !vehicle) {
      return res.status(400).json({
        success: false,
        message: "License information and vehicle information are required",
      });
    }

    const { type, brand, model, year, color, registrationNumber } = vehicle;

    if (!type || !brand || !model || !year || !color || !registrationNumber) {
      return res.status(400).json({
        success: false,
        message: "Complete vehicle information is required",
      });
    }

    const existingDriver = await Driver.findOne({
      user: req.user._id,
    });

    if (existingDriver) {
      return res.status(409).json({
        success: false,
        message: "You already have a driver application",
      });
    }

    const driver = await Driver.create({
      user: req.user._id,
      licenseNumber: licenseNumber.trim(),
      licenseExpiry,
      vehicle: {
        type,
        brand: brand.trim(),
        model: model.trim(),
        year,
        color: color.trim(),
        registrationNumber: registrationNumber.trim().toUpperCase(),
      },
    });

    await User.findByIdAndUpdate(req.user._id, {
      role: "driver",
    });

    return res.status(201).json({
      success: true,
      message: "Driver application submitted successfully",
      driver,
    });
  } catch (error) {
    console.error("Driver application error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while submitting driver application",
    });
  }
};

export const getDriverApplications = async (req, res) => {
  try {
    const drivers = await Driver.find()
      .populate("user", "name email phone avatar createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: drivers.length,
      drivers,
    });
  } catch (error) {
    console.error("Get driver applications error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching driver applications",
    });
  }
};

export const updateDriverStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    const allowedStatuses = ["approved", "rejected", "suspended"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid driver status",
      });
    }

    const driver = await Driver.findById(id);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver application not found",
      });
    }

    driver.status = status;

    if (status === "rejected") {
      driver.rejectionReason =
        rejectionReason?.trim() || "Application rejected by administrator";

      driver.isAvailable = false;
    }

    if (status === "approved") {
      driver.rejectionReason = "";
      driver.isAvailable = false;
    }

    if (status === "suspended") {
      driver.isAvailable = false;
    }

    await driver.save();

    return res.status(200).json({
      success: true,
      message: `Driver application ${status}`,
      driver,
    });
  } catch (error) {
    console.error("Update driver status error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating driver status",
    });
  }
};

export const goOnline = async (req, res) => {
  try {
    const driver = req.driver;

    driver.isAvailable = true;

    await driver.save();

    return res.status(200).json({
      success: true,
      message: "You are now online",
      isAvailable: driver.isAvailable,
    });
  } catch (error) {
    console.error("Go online error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while going online",
    });
  }
};

export const goOffline = async (req, res) => {
  try {
    const driver = req.driver;

    driver.isAvailable = false;

    await driver.save();

    return res.status(200).json({
      success: true,
      message: "You are now offline",
      isAvailable: driver.isAvailable,
    });
  } catch (error) {
    console.error("Go offline error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while going offline",
    });
  }
};

export const updateDriverLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude must be numbers",
      });
    }

    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: "Latitude must be between -90 and 90",
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: "Longitude must be between -180 and 180",
      });
    }

    const driver = req.driver;

    driver.currentLocation = {
      latitude,
      longitude,
      updatedAt: new Date(),
    };

    await driver.save();

    return res.status(200).json({
      success: true,
      message: "Location updated successfully",
      location: driver.currentLocation,
    });
  } catch (error) {
    console.error("Update location error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating location",
    });
  }
};

export const getMyDriverProfile = async (req, res) => {
  try {
    const driver = await Driver.findById(req.driver._id).populate(
      "user",
      "name email phone avatar",
    );

    return res.status(200).json({
      success: true,
      driver,
    });
  } catch (error) {
    console.error("Get driver profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching driver profile",
    });
  }
};
