import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8009/api",

  headers: {
    "Content-Type": "application/json",
  },

  timeout: 15000,
});

/*
|--------------------------------------------------------------------------
| REQUEST
|--------------------------------------------------------------------------
*/

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("gontobbo_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => Promise.reject(error),
);

/*
|--------------------------------------------------------------------------
| RESPONSE
|--------------------------------------------------------------------------
*/

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("gontobbo_token");

      localStorage.removeItem("gontobbo_user");
    }

    return Promise.reject(error);
  },
);

export default api;
