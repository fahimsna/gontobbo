import api from "./api";

/*
|--------------------------------------------------------------------------
| Create Ride
|--------------------------------------------------------------------------
*/

export const createRide = async ({
  pickup,
  destination,
  route,
  estimatedFare,
  vehicleType = "car",
}) => {
  const response = await api.post("/rides", {
    pickup,
    destination,

    distance: route?.distance || 0,

    duration: route?.duration || 0,

    estimatedFare: estimatedFare || 0,

    vehicleType,
  });

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Get My Rides
|--------------------------------------------------------------------------
*/

export const getMyRides = async () => {
  const response = await api.get("/rides/my-rides");

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Get Single Ride
|--------------------------------------------------------------------------
*/

export const getRideById = async (id) => {
  const response = await api.get(`/rides/${id}`);

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Cancel Ride
|--------------------------------------------------------------------------
*/

export const cancelRide = async (id) => {
  const response = await api.patch(`/rides/${id}/cancel`);

  return response.data;
};
