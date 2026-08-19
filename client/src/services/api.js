import axios from "axios";

/*
|--------------------------------------------------------------------------
| API CLIENT
|--------------------------------------------------------------------------
*/

const api = axios.create({
  baseURL: "https://gontobbo-api.onrender.com/api",

  headers: {
    "Content-Type": "application/json",
  },

  timeout: 15000,
});

/*
|--------------------------------------------------------------------------
| REQUEST INTERCEPTOR
|--------------------------------------------------------------------------
|
| Every authenticated request gets the current JWT.
|
*/

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("gontobbo_token");

    if (token) {
      config.headers = config.headers || {};

      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  },
);

/*
|--------------------------------------------------------------------------
| RESPONSE INTERCEPTOR
|--------------------------------------------------------------------------
|
| 401 = authentication/token problem.
|
| 403 = authenticated but forbidden.
|
| We MUST NOT automatically logout on 403.
|
|--------------------------------------------------------------------------
*/

api.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem("gontobbo_token");
      localStorage.removeItem("gontobbo_user");
    }

    return Promise.reject(error);
  },
);

export default api;
