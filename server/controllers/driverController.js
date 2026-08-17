import Driver from "../models/Driver.js";
import User from "../models/User.js";

/*
|--------------------------------------------------------------------------
| DRIVER APPLICATION
|--------------------------------------------------------------------------
*/

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

    if (!["car", "bike", "cng"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle type",
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

      licenseNumber: licenseNumber.trim().toUpperCase(),

      licenseExpiry,

      vehicle: {
        type,

        brand: brand.trim(),

        model: model.trim(),

        year: Number(year),

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

/*
|--------------------------------------------------------------------------
| ADMIN - GET DRIVER APPLICATIONS
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
| ADMIN - UPDATE DRIVER STATUS
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
     * Whenever a driver is rejected or suspended,
     * they must automatically go offline.
     */
    if (status === "rejected" || status === "suspended") {
      driver.isAvailable = false;
    }

    /*
     * Approved drivers start offline.
     * They must manually go online.
     */
    if (status === "approved") {
      driver.isAvailable = false;
      driver.rejectionReason = "";
    }

    if (status === "rejected") {
      driver.rejectionReason =
        rejectionReason?.trim() || "Application rejected by administrator";
    }

    if (status === "suspended") {
      driver.rejectionReason =
        rejectionReason?.trim() || "Driver account suspended by administrator";
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
| DRIVER - GET MY PROFILE
|--------------------------------------------------------------------------
*/

export const getMyDriverProfile = async (req, res) => {
  try {
    const driver = await Driver.findById(req.driver._id).populate(
      "user",
      "name email phone avatar",
    );

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
| DRIVER - GO ONLINE
|--------------------------------------------------------------------------
*/

export const goOnline = async (req, res) => {
  try {
    const driver = req.driver;

    /*
     * A driver should have a location before
     * becoming available for ride matching.
     */
    if (
      !driver.currentLocation ||
      !driver.currentLocation.coordinates ||
      driver.currentLocation.coordinates.length !== 2
    ) {
      return res.status(400).json({
        success: false,
        message: "Please update your location before going online",
      });
    }

    driver.isAvailable = true;

    await driver.save();

    return res.status(200).json({
      success: true,
      message: "You are now online",
      isAvailable: true,
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
| DRIVER - GO OFFLINE
|--------------------------------------------------------------------------
*/

export const goOffline = async (req, res) => {
  try {
    const driver = req.driver;

    driver.isAvailable = false;

    await driver.save();

    return res.status(200).json({
      success: true,
      message: "You are now offline",
      isAvailable: false,
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
| DRIVER - UPDATE LOCATION
|--------------------------------------------------------------------------
*/

export const updateDriverLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude must be valid numbers",
      });
    }

    if (lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        message: "Latitude must be between -90 and 90",
      });
    }

    if (lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: "Longitude must be between -180 and 180",
      });
    }

    const driver = req.driver;

    /*
     * GeoJSON Point.
     *
     * IMPORTANT:
     * coordinates = [longitude, latitude]
     */
    driver.currentLocation = {
      type: "Point",

      coordinates: [lng, lat],

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

/*
|--------------------------------------------------------------------------
| FIND NEARBY DRIVERS
|--------------------------------------------------------------------------
*/

export const getNearbyDrivers = async (req, res) => {
  try {
    const { latitude, longitude, vehicleType, maxDistance = 5000 } = req.query;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    const distance = Number(maxDistance);

    if (Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(distance)) {
      return res.status(400).json({
        success: false,
        message: "Latitude, longitude and maxDistance must be valid numbers",
      });
    }

    if (lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        message: "Latitude must be between -90 and 90",
      });
    }

    if (lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: "Longitude must be between -180 and 180",
      });
    }

    if (distance <= 0) {
      return res.status(400).json({
        success: false,
        message: "maxDistance must be greater than zero",
      });
    }

    /*
     * Build the query.
     *
     * $near automatically sorts results
     * from nearest to farthest.
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

          /*
           * MongoDB expects meters here.
           *
           * Default = 5000 meters = 5 km.
           */
          $maxDistance: distance,
        },
      },
    };

    /*
     * Optional vehicle filter.
     *
     * Example:
     *
     * ?vehicleType=car
     */
    if (vehicleType) {
      if (!["car", "bike", "cng"].includes(vehicleType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid vehicle type",
        });
      }

      query["vehicle.type"] = vehicleType;
    }

    const drivers = await Driver.find(query)
      .populate("user", "name phone avatar")
      .limit(20);

    return res.status(200).json({
      success: true,
      count: drivers.length,
      drivers,
    });
  } catch (error) {
    console.error("Nearby drivers error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while finding nearby drivers",
    });
  }
};
