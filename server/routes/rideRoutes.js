import express from "express";

import protect from "../middleware/authMiddleware.js";

import {
  createRide,
  getMyRides,
  getRideById,
  cancelRide,
} from "../controllers/rideController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Passenger Ride Routes
|--------------------------------------------------------------------------
*/

// Create ride
router.post("/", protect, createRide);

// Get my rides
router.get("/my-rides", protect, getMyRides);

// Get one ride
router.get("/:id", protect, getRideById);

// Cancel ride
router.patch("/:id/cancel", protect, cancelRide);

export default router;
