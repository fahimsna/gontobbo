import express from "express";

import protect from "../middleware/authMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";
import driverOnly from "../middleware/driverMiddleware.js";

import {
  applyAsDriver,
  getDriverApplications,
  updateDriverStatus,
  getMyDriverProfile,
  goOnline,
  goOffline,
  updateDriverLocation,
  getNearbyDrivers,
} from "../controllers/driverController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| DRIVER APPLICATION
|--------------------------------------------------------------------------
*/

/*
 * POST /api/drivers/apply
 */
router.post("/apply", protect, applyAsDriver);

/*
|--------------------------------------------------------------------------
| DRIVER PROFILE
|--------------------------------------------------------------------------
*/

/*
 * GET /api/drivers/me
 */
router.get("/me", protect, driverOnly, getMyDriverProfile);

/*
|--------------------------------------------------------------------------
| DRIVER AVAILABILITY
|--------------------------------------------------------------------------
*/

/*
 * PATCH /api/drivers/go-online
 */
router.patch("/go-online", protect, driverOnly, goOnline);

/*
 * PATCH /api/drivers/go-offline
 */
router.patch("/go-offline", protect, driverOnly, goOffline);

/*
|--------------------------------------------------------------------------
| DRIVER LOCATION
|--------------------------------------------------------------------------
*/

/*
 * PATCH /api/drivers/location
 */
router.patch("/location", protect, driverOnly, updateDriverLocation);

/*
|--------------------------------------------------------------------------
| NEARBY DRIVERS
|--------------------------------------------------------------------------
*/

/*
 * GET /api/drivers/nearby
 *
 * Example:
 *
 * /api/drivers/nearby
 * ?latitude=23.7806
 * &longitude=90.4125
 * &maxDistance=5000
 * &vehicleType=bike
 */

router.get("/nearby", protect, getNearbyDrivers);

/*
|--------------------------------------------------------------------------
| ADMIN
|--------------------------------------------------------------------------
*/

/*
 * GET /api/drivers/applications
 */
router.get("/applications", protect, adminOnly, getDriverApplications);

/*
 * PATCH /api/drivers/:id/status
 */
router.patch("/:id/status", protect, adminOnly, updateDriverStatus);

export default router;
