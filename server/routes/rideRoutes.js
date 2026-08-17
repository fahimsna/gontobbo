import express from "express";

import protect from "../middleware/authMiddleware.js";

import {
  createRide,
  getMyRides,
  getRideById,
  cancelRide,
} from "../controllers/rideController.js";

const router = express.Router();

// ==========================================
// Passenger ride request
// ==========================================

router.post("/", protect, createRide);

// ==========================================
// Passenger ride history
// ==========================================

router.get("/my-rides", protect, getMyRides);

// ==========================================
// Single ride
// ==========================================

router.get("/:id", protect, getRideById);

// ==========================================
// Cancel ride
// ==========================================

router.patch("/:id/cancel", protect, cancelRide);

export default router;
