import express from "express";

import protect from "../middleware/authMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";
import driverOnly from "../middleware/driverMiddleware.js";

import {
  applyAsDriver,
  getDriverApplications,
  updateDriverStatus,
  goOnline,
  goOffline,
  updateDriverLocation,
  getMyDriverProfile,
} from "../controllers/driverController.js";

const router = express.Router();

// ==========================================
// Driver application
// ==========================================

router.post("/apply", protect, applyAsDriver);

// ==========================================
// Driver profile
// ==========================================

router.get("/me", protect, driverOnly, getMyDriverProfile);

// ==========================================
// Driver availability
// ==========================================

router.patch("/go-online", protect, driverOnly, goOnline);

router.patch("/go-offline", protect, driverOnly, goOffline);

// ==========================================
// Driver location
// ==========================================

router.patch("/location", protect, driverOnly, updateDriverLocation);

// ==========================================
// Admin
// ==========================================

router.get("/applications", protect, adminOnly, getDriverApplications);

router.patch("/:id/status", protect, adminOnly, updateDriverStatus);

export default router;
