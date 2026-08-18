import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Home from "./pages/Home";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import DriverDashboard from "./pages/driver/DriverDashboard";
import DriverApplication from "./pages/driver/DriverApplication";

import PassengerDashboard from "./pages/passenger/PassengerDashboard";

import AdminDashboard from "./pages/admin/admin/AdminDashboard";

import { useAuth } from "./context/AuthContext";

/*
|--------------------------------------------------------------------------
| LOADING SCREEN
|--------------------------------------------------------------------------
*/

function RouteLoading({ message = "Loading..." }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-indigo-400" />

        <p className="text-sm text-slate-400">{message}</p>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| ROLE DASHBOARD
|--------------------------------------------------------------------------
|
| This is the central role-based redirect.
|
*/

function getDashboardPath(role) {
  switch (role) {
    case "passenger":
      return "/passenger/dashboard";

    case "driver":
      return "/driver/dashboard";

    case "admin":
      return "/admin/dashboard";

    default:
      return "/";
  }
}

/*
|--------------------------------------------------------------------------
| PROTECTED ROUTE
|--------------------------------------------------------------------------
*/

function ProtectedRoute({ children }) {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <RouteLoading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/*
|--------------------------------------------------------------------------
| ROLE ROUTE
|--------------------------------------------------------------------------
*/

function RoleRoute({ children, role }) {
  const { loading, isAuthenticated, user } = useAuth();

  if (loading) {
    return <RouteLoading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== role) {
    return <Navigate to={getDashboardPath(user?.role)} replace />;
  }

  return children;
}

/*
|--------------------------------------------------------------------------
| PUBLIC LOGIN REDIRECT
|--------------------------------------------------------------------------
|
| If an already authenticated user opens /login,
| send them to their own dashboard.
|
*/

function LoginRoute() {
  const { loading, isAuthenticated, user } = useAuth();

  if (loading) {
    return <RouteLoading />;
  }

  if (isAuthenticated && user?.role) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return <Login />;
}

/*
|--------------------------------------------------------------------------
| APP
|--------------------------------------------------------------------------
*/

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ==========================================================
              PUBLIC
          ========================================================== */}

        <Route path="/" element={<Home />} />

        <Route path="/home" element={<Home />} />

        <Route path="/login" element={<LoginRoute />} />

        <Route path="/register" element={<Register />} />

        {/* ==========================================================
              DRIVER
          ========================================================== */}

        <Route
          path="/driver"
          element={
            <RoleRoute role="driver">
              <DriverDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/driver/dashboard"
          element={
            <RoleRoute role="driver">
              <DriverDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/driver/apply"
          element={
            <RoleRoute role="driver">
              <DriverApplication />
            </RoleRoute>
          }
        />

        <Route
          path="/driver/application"
          element={
            <RoleRoute role="driver">
              <DriverApplication />
            </RoleRoute>
          }
        />

        {/* ==========================================================
              PASSENGER
          ========================================================== */}

        <Route
          path="/passenger"
          element={
            <RoleRoute role="passenger">
              <PassengerDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/passenger/dashboard"
          element={
            <RoleRoute role="passenger">
              <PassengerDashboard />
            </RoleRoute>
          }
        />

        {/* ==========================================================
              ADMIN
          ========================================================== */}

        <Route
          path="/admin"
          element={
            <RoleRoute role="admin">
              <AdminDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <RoleRoute role="admin">
              <AdminDashboard />
            </RoleRoute>
          }
        />

        {/* ==========================================================
              FALLBACK
          ========================================================== */}

        <Route path="*" element={<FallbackRoute />} />
      </Routes>
    </BrowserRouter>
  );
};

/*
|--------------------------------------------------------------------------
| FALLBACK ROUTE
|--------------------------------------------------------------------------
|
| If someone manually enters an invalid URL while logged in,
| don't blindly send them to the homepage.
|
*/

function FallbackRoute() {
  const { loading, isAuthenticated, user } = useAuth();

  if (loading) {
    return <RouteLoading />;
  }

  if (isAuthenticated && user?.role) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return <Navigate to="/" replace />;
}

export default App;
