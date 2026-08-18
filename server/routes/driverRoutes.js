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
 *
 * Any authenticated user can apply.
 */
router.post("/apply", protect, applyAsDriver);

/*
|--------------------------------------------------------------------------
| DRIVER PROFILE
|--------------------------------------------------------------------------
*/

/*
 * GET /api/drivers/me
 *
 * IMPORTANT:
 *
 * Do NOT use driverOnly here.
 *
 * A pending driver must be able to see:
 *
 * pending
 * approved
 * rejected
 * suspended
 *
 * driverOnly is intentionally NOT used.
 */
router.get("/me", protect, getMyDriverProfile);

/*
|--------------------------------------------------------------------------
| DRIVER AVAILABILITY
|--------------------------------------------------------------------------
*/

/*
 * PATCH /api/drivers/go-online
 *
 * Only approved drivers.
 */
router.patch("/go-online", protect, driverOnly, goOnline);

/*
 * PATCH /api/drivers/go-offline
 *
 * Only approved drivers.
 */
router.patch("/go-offline", protect, driverOnly, goOffline);

/*
|--------------------------------------------------------------------------
| DRIVER LOCATION
|--------------------------------------------------------------------------
*/

/*
 * PATCH /api/drivers/location
 *
 * Only approved drivers.
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
 * Passenger-side endpoint.
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
