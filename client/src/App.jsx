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
| PROTECTED ROUTE
|--------------------------------------------------------------------------
*/

function ProtectedRoute({ children }) {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-indigo-400" />

          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/*
|--------------------------------------------------------------------------
| ADMIN ROUTE
|--------------------------------------------------------------------------
*/

function AdminRoute({ children }) {
  const { loading, isAuthenticated, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-blue-400" />

          <p className="text-sm text-slate-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/*
|--------------------------------------------------------------------------
| DRIVER ROUTE
|--------------------------------------------------------------------------
*/

function DriverRoute({ children }) {
  const { loading, isAuthenticated, user } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-indigo-400" />

          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  /*
   * Only users whose account role is "driver" can enter
   * the driver area.
   */
  if (user?.role !== "driver") {
    return <Navigate to="/" replace />;
  }

  return children;
}

/*
|--------------------------------------------------------------------------
| PASSENGER ROUTE
|--------------------------------------------------------------------------
*/

function PassengerRoute({ children }) {
  const { loading, isAuthenticated, user } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-indigo-400" />

          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "passenger") {
    return <Navigate to="/" replace />;
  }

  return children;
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
        {/* ============================================================
            PUBLIC
        ============================================================ */}

        <Route path="/" element={<Home />} />

        <Route path="/home" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        {/* ============================================================
            DRIVER
        ============================================================ */}

        <Route
          path="/driver"
          element={
            <DriverRoute>
              <DriverDashboard />
            </DriverRoute>
          }
        />

        <Route
          path="/driver/dashboard"
          element={
            <DriverRoute>
              <DriverDashboard />
            </DriverRoute>
          }
        />

        <Route
          path="/driver/apply"
          element={
            <DriverRoute>
              <DriverApplication />
            </DriverRoute>
          }
        />

        <Route
          path="/driver/application"
          element={
            <DriverRoute>
              <DriverApplication />
            </DriverRoute>
          }
        />

        {/* ============================================================
            PASSENGER
        ============================================================ */}

        <Route
          path="/passenger"
          element={
            <PassengerRoute>
              <PassengerDashboard />
            </PassengerRoute>
          }
        />

        <Route
          path="/passenger/dashboard"
          element={
            <PassengerRoute>
              <PassengerDashboard />
            </PassengerRoute>
          }
        />

        {/* ============================================================
            ADMIN
        ============================================================ */}

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* ============================================================
            FALLBACK
        ============================================================ */}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
