import express from "express";

import protect from "../middleware/authMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";

import {
  applyAsDriver,
  getDriverApplications,
  updateDriverStatus,
} from "../controllers/driverController.js";

const router = express.Router();

// Driver
router.post("/apply", protect, applyAsDriver);

// Admin
router.get("/applications", protect, adminOnly, getDriverApplications);

router.patch("/:id/status", protect, adminOnly, updateDriverStatus);

export default router;
