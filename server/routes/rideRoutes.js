import express from "express";

import protect from "../middleware/authMiddleware.js";

import {
  requestRide,
  getMyRides,
  getRideById,
  cancelRide,
} from "../controllers/rideController.js";

const router = express.Router();

router.post("/", protect, requestRide);

router.get("/my-rides", protect, getMyRides);

router.get("/:id", protect, getRideById);

router.patch("/:id/cancel", protect, cancelRide);

export default router;
