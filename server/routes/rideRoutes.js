import express from "express";

import protect from "../middleware/authMiddleware.js";
import driverOnly from "../middleware/driverMiddleware.js";

import {
  createRide,
  getMyRides,
  getActiveRide,
  getRideById,
  cancelRide,
  getAvailableRides,
  getDriverRides,
  acceptRide,
  markDriverArriving,
  startRide,
  completeRide,
} from "../controllers/rideController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| PASSENGER
|--------------------------------------------------------------------------
*/

router.post("/", protect, createRide);

router.get("/my", protect, getMyRides);

router.get("/active", protect, getActiveRide);

/*
|--------------------------------------------------------------------------
| DRIVER
|--------------------------------------------------------------------------
|
| IMPORTANT:
| These MUST come before /:id.
|
|--------------------------------------------------------------------------
*/

router.get("/available", protect, driverOnly, getAvailableRides);

router.get("/driver/my", protect, driverOnly, getDriverRides);

/*
|--------------------------------------------------------------------------
| RIDE ACTIONS
|--------------------------------------------------------------------------
*/

router.patch("/:id/cancel", protect, cancelRide);

router.patch("/:id/accept", protect, driverOnly, acceptRide);

router.patch("/:id/arriving", protect, driverOnly, markDriverArriving);

router.patch("/:id/start", protect, driverOnly, startRide);

router.patch("/:id/complete", protect, driverOnly, completeRide);

/*
|--------------------------------------------------------------------------
| SINGLE RIDE
|--------------------------------------------------------------------------
|
| MUST BE LAST.
|
|--------------------------------------------------------------------------
*/

router.get("/:id", protect, getRideById);

export default router;
