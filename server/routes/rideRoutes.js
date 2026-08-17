import express from "express";

import protect from "../middleware/authMiddleware.js";
import driverOnly from "../middleware/driverMiddleware.js";

import {
  createRide,
  getMyRides,
  getRideById,
  cancelRide,
  getAvailableRides,
  acceptRide,
  getDriverRides,
  markDriverArriving,
  startRide,
  completeRide,
} from "../controllers/rideController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Passenger
|--------------------------------------------------------------------------
*/

// Create ride
router.post("/", protect, createRide);

// My rides
router.get("/my-rides", protect, getMyRides);

// Single ride
router.get("/:id", protect, getRideById);

// Cancel ride
router.patch("/:id/cancel", protect, cancelRide);

/*
|--------------------------------------------------------------------------
| Driver
|--------------------------------------------------------------------------
*/

// Available ride requests
router.get("/driver/available", protect, driverOnly, getAvailableRides);

// Accept ride
router.patch("/driver/:id/accept", protect, driverOnly, acceptRide);

// Driver active rides
router.get("/driver/my-rides", protect, driverOnly, getDriverRides);

// Driver arriving
router.patch("/driver/:id/arriving", protect, driverOnly, markDriverArriving);

// Start ride
router.patch("/driver/:id/start", protect, driverOnly, startRide);

// Complete ride
router.patch("/driver/:id/complete", protect, driverOnly, completeRide);

export default router;
