import Driver from "../models/Driver.js";

const driverOnly = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({
      user: req.user._id,
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver profile not found",
      });
    }

    if (driver.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Your driver account has not been approved",
      });
    }

    req.driver = driver;

    next();
  } catch (error) {
    console.error("Driver middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify driver account",
    });
  }
};

export default driverOnly;
