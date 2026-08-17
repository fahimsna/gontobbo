import Driver from "../models/Driver.js";

const driverOnly = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const driver = await Driver.findOne({
      user: req.user._id,
    });

    if (!driver) {
      return res.status(403).json({
        success: false,
        message: "Driver profile not found",
      });
    }

    /*
      |--------------------------------------------------------------------------
      | Only approved drivers can operate
      |--------------------------------------------------------------------------
      */

    if (driver.status !== "approved") {
      return res.status(403).json({
        success: false,
        message:
          driver.status === "pending"
            ? "Your driver application is still pending approval"
            : `Your driver account is ${driver.status}`,
      });
    }

    req.driver = driver;

    next();
  } catch (error) {
    console.error("Driver middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while checking driver account",
    });
  }
};

export default driverOnly;
