import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";

import Home from "./pages/Home";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import PassengerDashboard from "./pages/passenger/PassengerDashboard";

/*
|--------------------------------------------------------------------------
| Loading Screen
|--------------------------------------------------------------------------
*/

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-white" />

        <p className="text-sm text-slate-400">Loading Gontobbo...</p>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Protected Route
|--------------------------------------------------------------------------
*/

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/*
|--------------------------------------------------------------------------
| Role Route
|--------------------------------------------------------------------------
*/

function RoleRoute({ role, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    /*
    |--------------------------------------------------------------------------
    | Send user to their own dashboard
    |--------------------------------------------------------------------------
    */

    if (user.role === "driver") {
      return <Navigate to="/driver/dashboard" replace />;
    }

    if (user.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

/*
|--------------------------------------------------------------------------
| Dashboard Redirect
|--------------------------------------------------------------------------
*/

function DashboardRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  /*
  |--------------------------------------------------------------------------
  | Passenger
  |--------------------------------------------------------------------------
  */

  if (user.role === "passenger") {
    return <Navigate to="/dashboard" replace />;
  }

  /*
  |--------------------------------------------------------------------------
  | Driver
  |--------------------------------------------------------------------------
  */

  if (user.role === "driver") {
    return <Navigate to="/driver/dashboard" replace />;
  }

  /*
  |--------------------------------------------------------------------------
  | Admin
  |--------------------------------------------------------------------------
  */

  if (user.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/" replace />;
}

/*
|--------------------------------------------------------------------------
| App
|--------------------------------------------------------------------------
*/

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}

      <Route path="/" element={<Home />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      {/* Dashboard */}

      <Route
        path="/dashboard"
        element={
          <RoleRoute role="passenger">
            <PassengerDashboard />
          </RoleRoute>
        }
      />

      {/* Smart dashboard redirect */}

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <DashboardRedirect />
          </ProtectedRoute>
        }
      />

      {/* Future driver */}

      <Route
        path="/driver/dashboard"
        element={
          <ProtectedRoute>
            <DriverComingSoon />
          </ProtectedRoute>
        }
      />

      {/* Future admin */}

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <AdminComingSoon />
          </ProtectedRoute>
        }
      />

      {/* 404 */}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/*
|--------------------------------------------------------------------------
| Coming Soon Components
|--------------------------------------------------------------------------
*/

function DriverComingSoon() {
  const { logout } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-2xl">
          🚗
        </div>

        <h1 className="mt-6 text-2xl font-bold text-slate-950">
          Driver Dashboard
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          The driver experience is coming next.
        </p>

        <button
          onClick={logout}
          className="mt-6 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

function AdminComingSoon() {
  const { logout } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-2xl">
          🛡️
        </div>

        <h1 className="mt-6 text-2xl font-bold text-slate-950">
          Admin Dashboard
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          The admin experience is coming next.
        </p>

        <button
          onClick={logout}
          className="mt-6 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Root App
|--------------------------------------------------------------------------
*/

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
