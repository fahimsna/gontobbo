import api from "./api";

/*
|--------------------------------------------------------------------------
| PASSENGER
|--------------------------------------------------------------------------
*/

export const createRide = async (rideData) => {
  const response = await api.post("/rides", rideData);

  return response.data;
};

export const getMyRides = async () => {
  const response = await api.get("/rides/my");

  return response.data;
};

export const getActiveRide = async () => {
  const response = await api.get("/rides/active");

  return response.data;
};

export const getRideById = async (rideId) => {
  const response = await api.get(`/rides/${rideId}`);

  return response.data;
};

export const cancelRide = async (rideId, reason = "") => {
  const response = await api.patch(`/rides/${rideId}/cancel`, {
    reason,
  });

  return response.data;
};

/*
|--------------------------------------------------------------------------
| DRIVER
|--------------------------------------------------------------------------
*/

export const getAvailableRides = async () => {
  const response = await api.get("/rides/available");

  return response.data;
};

export const getDriverRides = async () => {
  const response = await api.get("/rides/driver/my");

  return response.data;
};

export const acceptRide = async (rideId) => {
  const response = await api.patch(`/rides/${rideId}/accept`);

  return response.data;
};

export const markDriverArriving = async (rideId) => {
  const response = await api.patch(`/rides/${rideId}/arriving`);

  return response.data;
};

export const startRide = async (rideId) => {
  const response = await api.patch(`/rides/${rideId}/start`);

  return response.data;
};

export const completeRide = async (rideId) => {
  const response = await api.patch(`/rides/${rideId}/complete`);

  return response.data;
};
