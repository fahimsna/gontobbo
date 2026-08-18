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
  rejectRide,
  markDriverArriving,
  startRide,
  completeRide,
} from "../controllers/rideController.js";

import { rateRide, getRideRating } from "../controllers/ratingController.js";

const router = express.Router();

router.post("/", protect, createRide);

router.get("/my", protect, getMyRides);

router.get("/active", protect, getActiveRide);

router.get("/available", protect, driverOnly, getAvailableRides);

router.get("/driver/my", protect, driverOnly, getDriverRides);

router.patch("/:id/cancel", protect, cancelRide);

router.patch("/:id/accept", protect, driverOnly, acceptRide);

router.patch("/:id/reject", protect, driverOnly, rejectRide);

router.patch("/:id/arriving", protect, driverOnly, markDriverArriving);

router.patch("/:id/start", protect, driverOnly, startRide);

router.patch("/:id/complete", protect, driverOnly, completeRide);

router.get("/:id/rating", protect, getRideRating);

router.post("/:id/rating", protect, rateRide);

router.get("/:id", protect, getRideById);

export default router;
