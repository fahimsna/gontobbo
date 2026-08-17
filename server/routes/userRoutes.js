import express from "express";

import protect from "../middleware/authMiddleware.js";
import { getMyProfile } from "../controllers/userController.js";

const router = express.Router();

router.get("/profile", protect, getMyProfile);

export default router;
