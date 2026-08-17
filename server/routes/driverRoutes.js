import express from "express";

import protect from "../middleware/authMiddleware.js";
import { applyAsDriver } from "../controllers/driverController.js";

const router = express.Router();

router.post("/apply", protect, applyAsDriver);

export default router;
