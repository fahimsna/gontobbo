import Driver from "../models/Driver.js";
import User from "../models/User.js";

/*
|--------------------------------------------------------------------------
| APPLY AS DRIVER
|--------------------------------------------------------------------------
*/

export const applyAsDriver = async (req, res) => {
  try {
    console.log("========== DRIVER APPLICATION ==========");

    console.log("USER:", req.user?._id);

    console.log("BODY:", JSON.stringify(req.body, null, 2));

    /*
    |--------------------------------------------------------------------------
    | AUTHENTICATION
    |--------------------------------------------------------------------------
    */

    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | REQUEST DATA
    |--------------------------------------------------------------------------
    */

    const { licenseNumber, licenseExpiry, vehicle } = req.body;

    /*
    |--------------------------------------------------------------------------
    | LICENSE NUMBER
    |--------------------------------------------------------------------------
    */

    if (!licenseNumber || !licenseNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: "Driving license number is required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | LICENSE EXPIRY
    |--------------------------------------------------------------------------
    */

    if (!licenseExpiry) {
      return res.status(400).json({
        success: false,
        message: "Driving license expiry date is required",
      });
    }

    const expiryDate = new Date(licenseExpiry);

    if (Number.isNaN(expiryDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid driving license expiry date",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | VEHICLE
    |--------------------------------------------------------------------------
    */

    if (!vehicle || typeof vehicle !== "object") {
      return res.status(400).json({
        success: false,
        message: "Vehicle information is required",
      });
    }

    const { type, brand, model, year, color, registrationNumber } = vehicle;

    /*
    |--------------------------------------------------------------------------
    | VEHICLE TYPE
    |--------------------------------------------------------------------------
    */

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Vehicle type is required",
      });
    }

    if (!["car", "bike", "cng"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle type",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | VEHICLE MODEL
    |--------------------------------------------------------------------------
    */

    if (!model || !model.trim()) {
      return res.status(400).json({
        success: false,
        message: "Vehicle model is required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | REGISTRATION NUMBER
    |--------------------------------------------------------------------------
    */

    if (!registrationNumber || !registrationNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: "Vehicle registration number is required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK EXISTING APPLICATION
    |--------------------------------------------------------------------------
    */

    const existingDriver = await Driver.findOne({
      user: req.user._id,
    });

    if (existingDriver) {
      return res.status(409).json({
        success: false,
        message: "You already have a driver application",
        driver: existingDriver,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | VEHICLE DATA
    |--------------------------------------------------------------------------
    |
    | Brand, year and color are optional.
    |
    */

    const vehicleData = {
      type,

      brand: brand?.trim() || "Not specified",

      model: model.trim(),

      year:
        year && Number.isFinite(Number(year))
          ? Number(year)
          : new Date().getFullYear(),

      color: color?.trim() || "Not specified",

      registrationNumber: registrationNumber.trim().toUpperCase(),
    };

    /*
    |--------------------------------------------------------------------------
    | CREATE DRIVER
    |--------------------------------------------------------------------------
    |
    | currentLocation is intentionally NOT included.
    |
    */

    const driver = await Driver.create({
      user: req.user._id,

      licenseNumber: licenseNumber.trim().toUpperCase(),

      licenseExpiry: expiryDate,

      vehicle: vehicleData,

      status: "pending",

      rejectionReason: "",

      isAvailable: false,

      rating: 5,

      totalRides: 0,
    });

    console.log("DRIVER CREATED:", driver._id);

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return res.status(201).json({
      success: true,

      message:
        "Driver application submitted successfully. Please wait for administrator approval.",

      driver,
    });
  } catch (error) {
    console.error("Driver application error:", error);

    /*
    |--------------------------------------------------------------------------
    | DUPLICATE
    |--------------------------------------------------------------------------
    */

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You already have a driver application",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | MONGOOSE VALIDATION
    |--------------------------------------------------------------------------
    */

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,

        message: Object.values(error.errors)
          .map((err) => err.message)
          .join(", "),
      });
    }

    /*
    |--------------------------------------------------------------------------
    | SERVER ERROR
    |--------------------------------------------------------------------------
    */

    return res.status(500).json({
      success: false,

      message: "Server error while submitting driver application",

      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET MY DRIVER PROFILE
|--------------------------------------------------------------------------
*/

export const getMyDriverProfile = async (req, res) => {
  try {
    const driver = await Driver.findOne({
      user: req.user._id,
    }).populate("user", "name email phone avatar");

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver profile not found",
      });
    }

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

/*
|--------------------------------------------------------------------------
| GET ALL DRIVER APPLICATIONS
| ADMIN
|--------------------------------------------------------------------------
*/

export const getDriverApplications = async (req, res) => {
  try {
    const drivers = await Driver.find()
      .populate("user", "name email phone avatar createdAt")
      .sort({
        createdAt: -1,
      });

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

/*
|--------------------------------------------------------------------------
| UPDATE DRIVER STATUS
| ADMIN
|--------------------------------------------------------------------------
*/

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

    /*
      |--------------------------------------------------------------------------
      | REJECTED
      |--------------------------------------------------------------------------
      */

    if (status === "rejected") {
      driver.isAvailable = false;

      driver.rejectionReason =
        rejectionReason?.trim() || "Application rejected by administrator";
    }

    /*
      |--------------------------------------------------------------------------
      | SUSPENDED
      |--------------------------------------------------------------------------
      */

    if (status === "suspended") {
      driver.isAvailable = false;

      driver.rejectionReason =
        rejectionReason?.trim() || "Driver account suspended by administrator";
    }

    /*
      |--------------------------------------------------------------------------
      | APPROVED
      |--------------------------------------------------------------------------
      */

    if (status === "approved") {
      driver.isAvailable = false;

      driver.rejectionReason = "";
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

/*
|--------------------------------------------------------------------------
| GO ONLINE
|--------------------------------------------------------------------------
*/

export const goOnline = async (req, res) => {
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
        message: "Your driver application must be approved first",
      });
    }

    /*
      |--------------------------------------------------------------------------
      | LOCATION REQUIRED
      |--------------------------------------------------------------------------
      */

    if (
      !driver.currentLocation ||
      driver.currentLocation.type !== "Point" ||
      !Array.isArray(driver.currentLocation.coordinates) ||
      driver.currentLocation.coordinates.length !== 2
    ) {
      return res.status(400).json({
        success: false,
        message: "Your current location is required before going online",
      });
    }

    driver.isAvailable = true;

    await driver.save();

    return res.status(200).json({
      success: true,

      message: "You are now online",

      driver,
    });
  } catch (error) {
    console.error("Go online error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while going online",
    });
  }
};

/*
|--------------------------------------------------------------------------
| GO OFFLINE
|--------------------------------------------------------------------------
*/

export const goOffline = async (req, res) => {
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

    driver.isAvailable = false;

    await driver.save();

    return res.status(200).json({
      success: true,

      message: "You are now offline",

      driver,
    });
  } catch (error) {
    console.error("Go offline error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while going offline",
    });
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE DRIVER LOCATION
|--------------------------------------------------------------------------
*/

export const updateDriverLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    const lat = Number(latitude);

    const lng = Number(longitude);

    /*
      |--------------------------------------------------------------------------
      | VALIDATE
      |--------------------------------------------------------------------------
      */

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude and longitude are required",
      });
    }

    if (lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude",
      });
    }

    if (lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: "Invalid longitude",
      });
    }

    const driver = await Driver.findOne({
      user: req.user._id,
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver profile not found",
      });
    }

    /*
      |--------------------------------------------------------------------------
      | GEOJSON
      |--------------------------------------------------------------------------
      |
      | GeoJSON coordinates are:
      |
      | [longitude, latitude]
      |
      */

    driver.currentLocation = {
      type: "Point",

      coordinates: [lng, lat],

      updatedAt: new Date(),
    };

    await driver.save();

    return res.status(200).json({
      success: true,

      message: "Driver location updated",

      location: driver.currentLocation,

      driver,
    });
  } catch (error) {
    console.error("Update driver location error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating driver location",
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET NEARBY DRIVERS
|--------------------------------------------------------------------------
*/

export const getNearbyDrivers = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 5000, vehicleType } = req.query;

    const lat = Number(latitude);

    const lng = Number(longitude);

    const distance = Number(maxDistance);

    /*
      |--------------------------------------------------------------------------
      | VALIDATION
      |--------------------------------------------------------------------------
      */

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude and longitude are required",
      });
    }

    /*
      |--------------------------------------------------------------------------
      | QUERY
      |--------------------------------------------------------------------------
      */

    const query = {
      status: "approved",

      isAvailable: true,

      currentLocation: {
        $near: {
          $geometry: {
            type: "Point",

            coordinates: [lng, lat],
          },

          $maxDistance: Number.isFinite(distance) ? distance : 5000,
        },
      },
    };

    /*
      |--------------------------------------------------------------------------
      | VEHICLE FILTER
      |--------------------------------------------------------------------------
      */

    if (vehicleType && ["car", "bike", "cng"].includes(vehicleType)) {
      query["vehicle.type"] = vehicleType;
    }

    /*
      |--------------------------------------------------------------------------
      | FIND
      |--------------------------------------------------------------------------
      */

    const drivers = await Driver.find(query)
      .populate("user", "name email phone avatar")
      .limit(20);

    return res.status(200).json({
      success: true,

      count: drivers.length,

      drivers,
    });
  } catch (error) {
    console.error("Get nearby drivers error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while finding nearby drivers",
    });
  }
};
