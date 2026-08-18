import api from "./api";

/*
|--------------------------------------------------------------------------
| PASSENGER RIDES
|--------------------------------------------------------------------------
*/

/*
 * Create a new passenger ride
 */
export async function createRide(rideData) {
  const response = await api.post("/rides", rideData);

  return response.data;
}

/*
 * Get passenger's current active ride
 */
export async function getActiveRide() {
  const response = await api.get("/rides/active");

  return response.data;
}

/*
 * Get passenger's ride history
 */
export async function getMyRides() {
  const response = await api.get("/rides/my");

  return response.data;
}

/*
 * Cancel passenger ride
 */
export async function cancelRide(rideId, reason = "Cancelled by passenger") {
  const response = await api.patch(`/rides/${rideId}/cancel`, {
    reason,
  });

  return response.data;
}

/*
|--------------------------------------------------------------------------
| DRIVER RIDES
|--------------------------------------------------------------------------
*/

/*
 * Get rides currently available for drivers
 */
export async function getAvailableRides() {
  const response = await api.get("/rides/available");

  return response.data;
}

/*
 * Get driver's ride history
 */
export async function getDriverRides() {
  const response = await api.get("/rides/driver/my");

  return response.data;
}

/*
 * Accept a passenger ride
 */
export async function acceptRide(rideId) {
  const response = await api.patch(`/rides/${rideId}/accept`);

  return response.data;
}

/*
 * Reject a passenger ride
 */
export async function rejectRide(rideId) {
  const response = await api.patch(`/rides/${rideId}/reject`);

  return response.data;
}

/*
 * Driver starts the ride
 */
export async function startRide(rideId) {
  const response = await api.patch(`/rides/${rideId}/start`);

  return response.data;
}

/*
 * Driver completes the ride
 */
export async function completeRide(rideId) {
  const response = await api.patch(`/rides/${rideId}/complete`);

  return response.data;
}

/*
 * Driver cancels a ride
 */
export async function cancelDriverRide(rideId, reason = "Cancelled by driver") {
  const response = await api.patch(`/rides/${rideId}/cancel`, {
    reason,
  });

  return response.data;
}

/*
|--------------------------------------------------------------------------
| DRIVER ONLINE / OFFLINE
|--------------------------------------------------------------------------
*/

/*
 * Set driver ONLINE
 *
 * Backend route:
 *
 * PATCH /api/drivers/go-online
 *
 * The backend requires:
 *
 * 1. Authenticated user
 * 2. Approved driver
 * 3. Current driver location
 */
export async function setDriverOnline() {
  const response = await api.patch("/drivers/go-online");

  return response.data;
}

/*
 * Set driver OFFLINE
 *
 * Backend route:
 *
 * PATCH /api/drivers/go-offline
 */
export async function setDriverOffline() {
  const response = await api.patch("/drivers/go-offline");

  return response.data;
}

/*
|--------------------------------------------------------------------------
| RATING
|--------------------------------------------------------------------------
*/

/*
 * Passenger rates completed ride
 */
export async function rateRide(rideId, rating, comment = "") {
  const response = await api.post(`/rides/${rideId}/rating`, {
    rating,
    comment,
  });

  return response.data;
}

/*
|--------------------------------------------------------------------------
| DRIVER LOCATION
|--------------------------------------------------------------------------
*/

/*
 * Update driver's current location
 *
 * Backend route:
 *
 * PATCH /api/drivers/location
 */
export async function updateDriverLocation(latitude, longitude) {
  const response = await api.patch("/drivers/location", {
    latitude,
    longitude,
  });

  return response.data;
}
