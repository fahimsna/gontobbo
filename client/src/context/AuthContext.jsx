import { createContext, useContext, useEffect, useState } from "react";

import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  /*
  |--------------------------------------------------------------------------
  | User state
  |--------------------------------------------------------------------------
  */

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("gontobbo_user");

      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      localStorage.removeItem("gontobbo_user");

      return null;
    }
  });

  /*
  |--------------------------------------------------------------------------
  | Initial loading
  |--------------------------------------------------------------------------
  */

  const [loading, setLoading] = useState(true);

  /*
  |--------------------------------------------------------------------------
  | Load authenticated user
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const token = localStorage.getItem("gontobbo_token");

    /*
    |--------------------------------------------------------------------------
    | No token
    |--------------------------------------------------------------------------
    */

    if (!token) {
      setLoading(false);
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Fetch current user
    |--------------------------------------------------------------------------
    */

    const loadUser = async () => {
      try {
        const response = await api.get("/users/me");

        const userData = response.data.user;

        setUser(userData);

        localStorage.setItem("gontobbo_user", JSON.stringify(userData));
      } catch (error) {
        console.error("Failed to restore authentication:", error);

        /*
          |--------------------------------------------------------------------------
          | Invalid/expired token
          |--------------------------------------------------------------------------
          */

        localStorage.removeItem("gontobbo_token");

        localStorage.removeItem("gontobbo_user");

        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Login
  |--------------------------------------------------------------------------
  */

  const login = (token, userData) => {
    localStorage.setItem("gontobbo_token", token);

    localStorage.setItem("gontobbo_user", JSON.stringify(userData));

    setUser(userData);
  };

  /*
  |--------------------------------------------------------------------------
  | Register
  |--------------------------------------------------------------------------
  */

  const register = async (registrationData) => {
    try {
      const response = await api.post("/auth/register", registrationData);

      const { token, user: userData } = response.data;

      /*
      |--------------------------------------------------------------------------
      | Save authentication
      |--------------------------------------------------------------------------
      */

      localStorage.setItem("gontobbo_token", token);

      localStorage.setItem("gontobbo_user", JSON.stringify(userData));

      setUser(userData);

      return {
        token,
        user: userData,
      };
    } catch (error) {
      /*
      |--------------------------------------------------------------------------
      | Normalize API error
      |--------------------------------------------------------------------------
      */

      const message =
        error.response?.data?.message ||
        error.message ||
        "Registration failed.";

      throw new Error(message);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  */

  const logout = () => {
    localStorage.removeItem("gontobbo_token");

    localStorage.removeItem("gontobbo_user");

    setUser(null);
  };

  /*
  |--------------------------------------------------------------------------
  | Authentication state
  |--------------------------------------------------------------------------
    */

  const isAuthenticated = !!user;

  /*
  |--------------------------------------------------------------------------
  | Role helpers
  |--------------------------------------------------------------------------
  */

  const isPassenger = user?.role === "passenger";

  const isDriver = user?.role === "driver";

  const isAdmin = user?.role === "admin";

  /*
  |--------------------------------------------------------------------------
  | Context value
  |--------------------------------------------------------------------------
  */

  const value = {
    user,

    loading,

    isAuthenticated,

    isPassenger,

    isDriver,

    isAdmin,

    login,

    register,

    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/*
|--------------------------------------------------------------------------
| useAuth hook
|--------------------------------------------------------------------------
*/

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }

  return context;
}
