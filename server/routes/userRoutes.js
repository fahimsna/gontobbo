import express from "express";

import protect from "../middleware/authMiddleware.js";
import { getMyProfile } from "../controllers/userController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Get Current User
|--------------------------------------------------------------------------
| Used by AuthContext when restoring authentication after refresh.
|--------------------------------------------------------------------------
*/

router.get("/me", protect, getMyProfile);

/*
|--------------------------------------------------------------------------
| Get My Profile
|--------------------------------------------------------------------------
*/

router.get("/profile", protect, getMyProfile);

export default router;
