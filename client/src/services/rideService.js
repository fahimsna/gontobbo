import api from "./api";

/*
|--------------------------------------------------------------------------
| Passenger - Create Ride
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
| Passenger - My Rides
|--------------------------------------------------------------------------
*/

export const getMyRides = async () => {
  const response = await api.get("/rides/my-rides");

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Passenger - Single Ride
|--------------------------------------------------------------------------
*/

export const getRideById = async (id) => {
  const response = await api.get(`/rides/${id}`);

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Passenger - Cancel Ride
|--------------------------------------------------------------------------
*/

export const cancelRide = async (id) => {
  const response = await api.patch(`/rides/${id}/cancel`);

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Driver - Available Rides
|--------------------------------------------------------------------------
*/

export const getAvailableRides = async () => {
  const response = await api.get("/rides/driver/available");

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Driver - Accept Ride
|--------------------------------------------------------------------------
*/

export const acceptRide = async (id) => {
  const response = await api.patch(`/rides/driver/${id}/accept`);

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Driver - My Active Rides
|--------------------------------------------------------------------------
*/

export const getDriverRides = async () => {
  const response = await api.get("/rides/driver/my-rides");

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Driver - Mark Arriving
|--------------------------------------------------------------------------
*/

export const markDriverArriving = async (id) => {
  const response = await api.patch(`/rides/driver/${id}/arriving`);

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Driver - Start Ride
|--------------------------------------------------------------------------
*/

export const startRide = async (id) => {
  const response = await api.patch(`/rides/driver/${id}/start`);

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Driver - Complete Ride
|--------------------------------------------------------------------------
*/

export const completeRide = async (id) => {
  const response = await api.patch(`/rides/driver/${id}/complete`);

  return response.data;
};
