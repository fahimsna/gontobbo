import Driver from "../models/Driver.js";

const driverOnly = async (req, res, next) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | AUTHENTICATION
    |--------------------------------------------------------------------------
    */

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | FIND DRIVER PROFILE
    |--------------------------------------------------------------------------
    */

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
    | DRIVER STATUS
    |--------------------------------------------------------------------------
    */

    if (driver.status !== "approved") {
      let message = "Driver account is not active.";

      if (driver.status === "pending") {
        message = "Your driver application is still pending approval.";
      }

      if (driver.status === "rejected") {
        message =
          driver.rejectionReason || "Your driver application was rejected.";
      }

      if (driver.status === "suspended") {
        message = driver.rejectionReason || "Your driver account is suspended.";
      }

      return res.status(403).json({
        success: false,
        message,
        status: driver.status,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | ATTACH DRIVER
    |--------------------------------------------------------------------------
    |
    | Controllers can now use:
    |
    | req.driver
    |
    |--------------------------------------------------------------------------
    */

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
