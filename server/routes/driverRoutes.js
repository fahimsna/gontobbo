import express from "express";

import protect from "../middleware/authMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";
import driverOnly from "../middleware/driverMiddleware.js";

import {
  applyAsDriver,
  getDriverApplications,
  updateDriverStatus,
  getMyDriverProfile,
  goOnline,
  goOffline,
  updateDriverLocation,
  getNearbyDrivers,
} from "../controllers/driverController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| DRIVER APPLICATION
|--------------------------------------------------------------------------
*/

// User applies to become a driver
router.post("/apply", protect, applyAsDriver);

/*
|--------------------------------------------------------------------------
| DRIVER PROFILE
|--------------------------------------------------------------------------
*/

// Get logged-in driver's profile
router.get("/me", protect, driverOnly, getMyDriverProfile);

/*
|--------------------------------------------------------------------------
| DRIVER AVAILABILITY
|--------------------------------------------------------------------------
*/

// Driver goes online
router.patch("/go-online", protect, driverOnly, goOnline);

// Driver goes offline
router.patch("/go-offline", protect, driverOnly, goOffline);

/*
|--------------------------------------------------------------------------
| DRIVER LOCATION
|--------------------------------------------------------------------------
*/

// Update driver's current location
router.patch("/location", protect, driverOnly, updateDriverLocation);

/*
|--------------------------------------------------------------------------
| NEARBY DRIVER SEARCH
|--------------------------------------------------------------------------
*/

// Find nearby available drivers
//
// Example:
//
// GET /api/drivers/nearby
//     ?latitude=23.7806
//     &longitude=90.4258
//     &maxDistance=5000
//     &vehicleType=car
//
router.get("/nearby", protect, getNearbyDrivers);

/*
|--------------------------------------------------------------------------
| ADMIN DRIVER MANAGEMENT
|--------------------------------------------------------------------------
*/

// Get all driver applications
router.get("/applications", protect, adminOnly, getDriverApplications);

// Approve / reject / suspend driver
router.patch("/:id/status", protect, adminOnly, updateDriverStatus);

export default router;
