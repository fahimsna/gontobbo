import express from "express";

import protect from "../middleware/authMiddleware.js";
import { getMyProfile } from "../controllers/userController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Current User
|--------------------------------------------------------------------------
*/

// Used by AuthContext when restoring login session
router.get("/me", protect, getMyProfile);

// Alternative profile endpoint
router.get("/profile", protect, getMyProfile);

export default router;
