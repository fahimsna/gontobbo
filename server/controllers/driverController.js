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

    // Check existing driver profile
    const existingDriver = await Driver.findOne({
      user: req.user._id,
    });

    if (existingDriver) {
      return res.status(409).json({
        success: false,
        message: "You already have a driver application",
      });
    }

    // Create driver
    const driver = await Driver.create({
      user: req.user._id,
      licenseNumber,
      licenseExpiry,
      vehicle: {
        type,
        brand,
        model,
        year,
        color,
        registrationNumber,
      },
    });

    // Update user role
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
