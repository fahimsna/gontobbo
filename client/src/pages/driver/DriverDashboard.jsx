import { useCallback, useEffect, useState } from "react";
import {
  Car,
  CheckCircle2,
  Clock3,
  LogOut,
  MapPin,
  Navigation,
  RefreshCw,
  Route,
  User,
  XCircle,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

import {
  acceptRide,
  getAvailableRides,
  getDriverRides,
  markDriverArriving,
  startRide,
  completeRide,
} from "../../services/rideService";

export default function DriverDashboard() {
  const { user, logout } = useAuth();

  const [driver, setDriver] = useState(null);
  const [availableRides, setAvailableRides] = useState([]);
  const [activeRides, setActiveRides] = useState([]);

  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState(null);

  const [error, setError] = useState("");

  const loadDriver = useCallback(async () => {
    try {
      const response = await api.get("/drivers/me");

      setDriver(response.data.driver);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load driver profile.");
    }
  }, []);

  const loadRides = useCallback(async () => {
    try {
      const [availableResponse, activeResponse] = await Promise.all([
        getAvailableRides(),
        getDriverRides(),
      ]);

      setAvailableRides(availableResponse.rides || []);

      setActiveRides(activeResponse.rides || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load rides.");
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    await Promise.all([loadDriver(), loadRides()]);

    setLoading(false);
  }, [loadDriver, loadRides]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /*
  |--------------------------------------------------------------------------
  | Refresh every 10 seconds
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const interval = setInterval(() => {
      loadRides();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [loadRides]);

  /*
  |--------------------------------------------------------------------------
  | Accept ride
  |--------------------------------------------------------------------------
  */

  const handleAcceptRide = async (rideId) => {
    try {
      setActionLoading(rideId);
      setError("");

      await acceptRide(rideId);

      await loadRides();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to accept ride.");
    } finally {
      setActionLoading(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Ride status actions
  |--------------------------------------------------------------------------
  */

  const handleStatusAction = async (ride) => {
    try {
      setActionLoading(ride._id);
      setError("");

      if (ride.status === "accepted") {
        await markDriverArriving(ride._id);
      } else if (ride.status === "driver_arriving") {
        await startRide(ride._id);
      } else if (ride.status === "in_progress") {
        await completeRide(ride._id);
      }

      await loadRides();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update ride.");
    } finally {
      setActionLoading(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex items-center gap-3 text-slate-400">
          <RefreshCw size={20} className="animate-spin" />
          Loading driver dashboard...
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}

      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500">
              <Car size={20} />
            </div>

            <div>
              <h1 className="font-bold">Gontobbo</h1>

              <p className="text-xs text-slate-500">Driver Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-400 sm:block">
              {user?.name || user?.email || "Driver"}
            </span>

            <button
              onClick={logout}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:bg-white/5 hover:text-white"
              title="Logout"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Error */}

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <XCircle size={17} />
            {error}
          </div>
        )}

        {/* Driver status */}

        <section className="mb-6 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/10 to-transparent p-6">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm text-slate-500">Welcome back</p>

                <h2 className="mt-1 text-2xl font-bold">
                  {user?.name || "Driver"}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Ready to find your next passenger?
                </p>
              </div>

              <div
                className={`inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-medium ${
                  driver?.availability === "online"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    driver?.availability === "online"
                      ? "bg-emerald-400"
                      : "bg-slate-500"
                  }`}
                />

                {driver?.availability === "online" ? "Online" : "Offline"}
              </div>
            </div>
          </div>

          {/* Driver card */}

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-slate-300">
                <User size={20} />
              </div>

              <div>
                <p className="font-semibold">
                  {driver?.vehicleModel || "Vehicle"}
                </p>

                <p className="text-sm text-slate-500">
                  {driver?.vehicleNumber || "No vehicle number"}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4 text-sm">
              <span className="text-slate-500">Rating</span>

              <span className="font-semibold">
                ⭐ {driver?.rating ?? "5.0"}
              </span>
            </div>
          </div>
        </section>

        {/* Stats */}

        <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={<Navigation size={18} />}
            label="Available"
            value={availableRides.length}
          />

          <StatCard
            icon={<Route size={18} />}
            label="Active rides"
            value={activeRides.length}
          />

          <StatCard
            icon={<Car size={18} />}
            label="Total trips"
            value={driver?.totalTrips ?? 0}
          />

          <StatCard
            icon={<CheckCircle2 size={18} />}
            label="Rating"
            value={`${driver?.rating ?? 5}`}
          />
        </section>

        {/* Available rides */}

        <section className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Ride requests</h2>

              <p className="mt-1 text-sm text-slate-500">
                New passengers looking for a driver.
              </p>
            </div>

            <button
              onClick={loadRides}
              className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>

          {availableRides.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-slate-500">
                <Clock3 size={24} />
              </div>

              <h3 className="mt-4 font-semibold">No ride requests yet</h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                New passenger requests will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {availableRides.map((ride) => (
                <RideRequestCard
                  key={ride._id}
                  ride={ride}
                  loading={actionLoading === ride._id}
                  onAccept={handleAcceptRide}
                />
              ))}
            </div>
          )}
        </section>

        {/* Active rides */}

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold">Active rides</h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage the rides you've accepted.
            </p>
          </div>

          {activeRides.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-center text-sm text-slate-500">
              You don't have any active rides.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {activeRides.map((ride) => (
                <ActiveRideCard
                  key={ride._id}
                  ride={ride}
                  loading={actionLoading === ride._id}
                  onAction={handleStatusAction}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Stat Card
|--------------------------------------------------------------------------
*/

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
        {icon}
      </div>

      <p className="mt-4 text-sm text-slate-500">{label}</p>

      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Ride Request Card
|--------------------------------------------------------------------------
*/

function RideRequestCard({ ride, loading, onAccept }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-indigo-500/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-indigo-400">
            New request
          </p>

          <h3 className="mt-1 font-semibold">Passenger ride</h3>
        </div>

        <div className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-sm font-semibold text-emerald-400">
          ৳ {Number(ride.estimatedFare || 0).toFixed(0)}
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <LocationRow
          icon={<div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />}
          label="Pickup"
          value={ride.pickup?.address || "Pickup location"}
        />

        <LocationRow
          icon={<div className="h-2.5 w-2.5 rounded-full bg-red-400" />}
          label="Destination"
          value={ride.destination?.address || "Destination"}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/5 pt-4">
        <div>
          <p className="text-xs text-slate-600">Distance</p>

          <p className="mt-1 text-sm font-medium">
            {Number(ride.distanceKm || 0).toFixed(1)} km
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-600">Duration</p>

          <p className="mt-1 text-sm font-medium">
            {Math.round(ride.durationMinutes || 0)} min
          </p>
        </div>
      </div>

      <button
        onClick={() => onAccept(ride._id)}
        disabled={loading}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 font-semibold transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <RefreshCw size={17} className="animate-spin" />
            Accepting...
          </>
        ) : (
          <>
            Accept ride
            <CheckCircle2 size={17} />
          </>
        )}
      </button>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Active Ride Card
|--------------------------------------------------------------------------
*/

function ActiveRideCard({ ride, loading, onAction }) {
  const actionLabel =
    ride.status === "accepted"
      ? "I'm arriving"
      : ride.status === "driver_arriving"
        ? "Start ride"
        : "Complete ride";

  return (
    <div className="rounded-3xl border border-indigo-500/20 bg-indigo-500/[0.04] p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-indigo-400">
            Active ride
          </p>

          <h3 className="mt-1 font-semibold">
            {ride.passenger?.name || "Passenger"}
          </h3>
        </div>

        <StatusBadge status={ride.status} />
      </div>

      <div className="mt-5 space-y-4">
        <LocationRow
          icon={<MapPin size={16} className="text-emerald-400" />}
          label="Pickup"
          value={ride.pickup?.address || "Pickup"}
        />

        <LocationRow
          icon={<MapPin size={16} className="text-red-400" />}
          label="Destination"
          value={ride.destination?.address || "Destination"}
        />
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
        <div>
          <p className="text-xs text-slate-600">Fare</p>

          <p className="font-semibold">
            ৳ {Number(ride.estimatedFare || 0).toFixed(0)}
          </p>
        </div>

        <button
          onClick={() => onAction(ride)}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold transition hover:bg-indigo-400 disabled:opacity-50"
        >
          {loading && <RefreshCw size={15} className="animate-spin" />}

          {actionLabel}
        </button>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Location Row
|--------------------------------------------------------------------------
*/

function LocationRow({ icon, label, value }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs text-slate-600">{label}</p>

        <p className="mt-0.5 line-clamp-2 text-sm text-slate-300">{value}</p>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Status Badge
|--------------------------------------------------------------------------
*/

function StatusBadge({ status }) {
  const labels = {
    accepted: "Accepted",
    driver_arriving: "Arriving",
    in_progress: "In progress",
  };

  return (
    <span className="rounded-full bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300">
      {labels[status] || status}
    </span>
  );
}
