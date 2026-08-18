import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ArrowRight,
  Car,
  CheckCircle2,
  Clock3,
  DollarSign,
  LogOut,
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  Route,
  Star,
  User,
  XCircle,
  Zap,
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

  const [refreshing, setRefreshing] = useState(false);

  const [actionLoading, setActionLoading] = useState(null);

  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | LOAD DRIVER PROFILE
  |--------------------------------------------------------------------------
  */

  const loadDriver = useCallback(async () => {
    try {
      const response = await api.get("/drivers/me");

      const driverData = response.data?.driver || null;

      setDriver(driverData);

      return driverData;
    } catch (err) {
      console.error("Load driver profile error:", err);

      setError(err.response?.data?.message || "Unable to load driver profile.");

      return null;
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | LOAD RIDES
  |--------------------------------------------------------------------------
  */

  const loadRides = useCallback(async () => {
    /*
     * IMPORTANT:
     *
     * Never request driver ride APIs
     * unless the driver is approved.
     *
     * This prevents:
     *
     * GET /rides/available -> 403
     * GET /rides/driver/my -> 403
     */

    if (!driver || driver.status !== "approved") {
      setAvailableRides([]);
      setActiveRides([]);

      return;
    }

    try {
      const [availableResponse, activeResponse] = await Promise.all([
        getAvailableRides(),
        getDriverRides(),
      ]);

      setAvailableRides(availableResponse?.rides || []);

      setActiveRides(activeResponse?.rides || []);
    } catch (err) {
      console.error("Load rides error:", err);

      setError(err.response?.data?.message || "Unable to load rides.");
    }
  }, [driver]);

  /*
  |--------------------------------------------------------------------------
  | INITIAL DASHBOARD LOAD
  |--------------------------------------------------------------------------
  */

  const loadDashboard = useCallback(
    async (showLoader = true) => {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      const driverData = await loadDriver();

      /*
       * Use the freshly returned driver
       * rather than waiting for React state.
       */

      if (driverData?.status === "approved") {
        try {
          const [availableResponse, activeResponse] = await Promise.all([
            getAvailableRides(),
            getDriverRides(),
          ]);

          setAvailableRides(availableResponse?.rides || []);

          setActiveRides(activeResponse?.rides || []);
        } catch (err) {
          console.error("Initial ride load error:", err);

          setError(err.response?.data?.message || "Unable to load rides.");
        }
      } else {
        setAvailableRides([]);
        setActiveRides([]);
      }

      if (showLoader) {
        setLoading(false);
      }
    },
    [loadDriver],
  );

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /*
  |--------------------------------------------------------------------------
  | AUTO REFRESH
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    /*
     * Only poll ride APIs for an approved
     * driver.
     */

    if (driver?.status !== "approved") {
      return undefined;
    }

    const interval = setInterval(() => {
      loadRides();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [driver?.status, loadRides]);

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  const handleRefresh = async () => {
    setRefreshing(true);

    await loadDashboard(false);

    setRefreshing(false);
  };

  /*
  |--------------------------------------------------------------------------
  | ACCEPT RIDE
  |--------------------------------------------------------------------------
  */

  const handleAcceptRide = async (rideId) => {
    try {
      setActionLoading(rideId);

      setError("");

      await acceptRide(rideId);

      await loadRides();
    } catch (err) {
      console.error("Accept ride error:", err);

      setError(err.response?.data?.message || "Failed to accept ride.");
    } finally {
      setActionLoading(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | RIDE STATUS ACTION
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
      console.error("Ride status update error:", err);

      setError(err.response?.data?.message || "Failed to update ride.");
    } finally {
      setActionLoading(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DERIVED DATA
  |--------------------------------------------------------------------------
  */

  const totalTrips = Number(driver?.totalRides || 0);

  const rating = Number(driver?.rating || 5);

  const isApproved = driver?.status === "approved";

  const isOnline = driver?.isAvailable === true;

  const estimatedEarnings = useMemo(() => {
    return activeRides.reduce(
      (total, ride) => total + Number(ride.estimatedFare || 0),
      0,
    );
  }, [activeRides]);

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10">
            <Car size={30} className="text-indigo-400" />
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
            <RefreshCw size={16} className="animate-spin" />
            Loading your dashboard...
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      {/* ================================================================
          HEADER
      ================================================================ */}

      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#07111f]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/20">
              <Car size={21} strokeWidth={2.4} />
            </div>

            <div>
              <h1 className="text-base font-bold tracking-tight">Gontobbo</h1>

              <p className="text-[11px] text-slate-500">Driver workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{user?.name || "Driver"}</p>

              <p className="text-xs text-slate-500">Driver account</p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-sm font-bold text-slate-300">
              {getInitials(user?.name || user?.email)}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] text-slate-400 transition hover:border-red-400/20 hover:bg-red-500/10 hover:text-red-300"
              title="Logout"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ================================================================
            ERROR
        ================================================================ */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/[0.08] px-4 py-3.5 text-sm text-red-300">
            <XCircle size={18} className="mt-0.5 shrink-0" />

            <span className="flex-1">{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-400/70 hover:text-red-300"
            >
              ×
            </button>
          </div>
        )}

        {/* ================================================================
            HERO
        ================================================================ */}

        <section className="mb-6 overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-indigo-500/[0.14] via-white/[0.03] to-transparent">
          <div className="relative p-6 sm:p-8">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-indigo-500/[0.08] blur-3xl" />

            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-400">
                  <Zap size={13} className="text-indigo-400" />
                  Driver mode
                </div>

                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Good to see you,
                  <span className="text-indigo-400">
                    {" "}
                    {firstName(user?.name)}
                  </span>
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                  Manage your rides, accept new passengers and keep moving
                  through Dhaka.
                </p>
              </div>

              {/* STATUS */}

              <div className="min-w-[260px] rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">Account status</p>

                    <p className="mt-1 text-sm font-bold">
                      {getStatusLabel(driver?.status)}
                    </p>
                  </div>

                  <StatusIcon status={driver?.status} />
                </div>

                {isApproved && (
                  <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-4">
                    <div>
                      <p className="text-xs text-slate-500">Availability</p>

                      <p className="mt-1 text-sm font-semibold">
                        {isOnline ? "Online" : "Offline"}
                      </p>
                    </div>

                    <div
                      className={`h-3 w-3 rounded-full ${
                        isOnline
                          ? "bg-emerald-400 shadow-lg shadow-emerald-400/40"
                          : "bg-slate-600"
                      }`}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            PENDING
        ================================================================ */}

        {!driver && <EmptyDriverProfile />}

        {driver && driver.status === "pending" && (
          <StatusMessage
            type="pending"
            title="Your application is under review"
            message="Your driver application has been submitted successfully. An administrator must approve your application before you can accept rides."
          />
        )}

        {driver && driver.status === "rejected" && (
          <StatusMessage
            type="rejected"
            title="Your application was rejected"
            message={
              driver.rejectionReason ||
              "Please review your application information and submit again."
            }
          />
        )}

        {driver && driver.status === "suspended" && (
          <StatusMessage
            type="suspended"
            title="Your driver account is suspended"
            message={
              driver.rejectionReason ||
              "Please contact the administrator for more information."
            }
          />
        )}

        {/* ================================================================
            APPROVED DRIVER
        ================================================================ */}

        {isApproved && (
          <>
            {/* STATS */}

            <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                icon={<Route size={17} />}
                label="Total rides"
                value={totalTrips}
              />

              <StatCard
                icon={<Star size={17} />}
                label="Rating"
                value={rating.toFixed(1)}
              />

              <StatCard
                icon={<Car size={17} />}
                label="Available"
                value={availableRides.length}
              />

              <StatCard
                icon={<DollarSign size={17} />}
                label="Active fare"
                value={`৳${estimatedEarnings.toFixed(0)}`}
              />
            </section>

            {/* REFRESH */}

            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Ride requests</h3>

                <p className="mt-1 text-xs text-slate-500">
                  Available rides for your vehicle type
                </p>
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.07] disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>

            {/* AVAILABLE RIDES */}

            {availableRides.length === 0 ? (
              <section className="mb-7 rounded-[28px] border border-white/[0.07] bg-white/[0.02] p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-slate-500">
                  <MapPin size={22} />
                </div>

                <h3 className="mt-4 text-sm font-bold">No ride requests yet</h3>

                <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">
                  Stay online and new ride requests will appear here
                  automatically.
                </p>
              </section>
            ) : (
              <section className="mb-7 grid gap-4 lg:grid-cols-2">
                {availableRides.map((ride) => (
                  <AvailableRideCard
                    key={ride._id}
                    ride={ride}
                    loading={actionLoading === ride._id}
                    onAccept={handleAcceptRide}
                  />
                ))}
              </section>
            )}

            {/* ACTIVE RIDES */}

            {activeRides.length > 0 && (
              <section>
                <div className="mb-4">
                  <h3 className="text-lg font-bold">Active rides</h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Manage your current passenger rides
                  </p>
                </div>

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
              </section>
            )}
          </>
        )}

        {/* ================================================================
            DRIVER INFORMATION
        ================================================================ */}

        {driver && (
          <section className="mt-7 rounded-[28px] border border-white/[0.07] bg-white/[0.02] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                <User size={18} />
              </div>

              <div>
                <h3 className="text-sm font-bold">Driver information</h3>

                <p className="text-xs text-slate-600">
                  Your registered driver details
                </p>
              </div>
            </div>

            <div className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              <InfoRow
                label="Name"
                value={driver.user?.name || user?.name || "—"}
              />

              <InfoRow
                label="Email"
                value={driver.user?.email || user?.email || "—"}
              />

              <InfoRow
                label="Phone"
                value={driver.user?.phone || user?.phone || "—"}
              />

              <InfoRow label="License" value={driver.licenseNumber || "—"} />

              <InfoRow
                label="Vehicle"
                value={
                  `${driver.vehicle?.brand || ""} ${
                    driver.vehicle?.model || ""
                  }`.trim() || "—"
                }
              />

              <InfoRow
                label="Registration"
                value={driver.vehicle?.registrationNumber || "—"}
              />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

function handleLogout() {
  localStorage.removeItem("gontobbo_token");

  localStorage.removeItem("gontobbo_user");

  window.location.href = "/login";
}

/*
|--------------------------------------------------------------------------
| STATUS MESSAGE
|--------------------------------------------------------------------------
*/

function StatusMessage({ type, title, message }) {
  const config = {
    pending: {
      icon: <Clock3 size={22} />,
      wrapper: "border-amber-400/20 bg-amber-500/[0.06]",
      iconWrapper: "bg-amber-500/10 text-amber-400",
      title: "text-amber-300",
    },

    rejected: {
      icon: <XCircle size={22} />,
      wrapper: "border-red-400/20 bg-red-500/[0.06]",
      iconWrapper: "bg-red-500/10 text-red-400",
      title: "text-red-300",
    },

    suspended: {
      icon: <XCircle size={22} />,
      wrapper: "border-orange-400/20 bg-orange-500/[0.06]",
      iconWrapper: "bg-orange-500/10 text-orange-400",
      title: "text-orange-300",
    },
  };

  const current = config[type] || config.pending;

  return (
    <section className={`mb-7 rounded-[28px] border p-6 ${current.wrapper}`}>
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${current.iconWrapper}`}
        >
          {current.icon}
        </div>

        <div>
          <h3 className={`text-base font-bold ${current.title}`}>{title}</h3>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            {message}
          </p>
        </div>
      </div>
    </section>
  );
}

/*
|--------------------------------------------------------------------------
| EMPTY PROFILE
|--------------------------------------------------------------------------
*/

function EmptyDriverProfile() {
  return (
    <StatusMessage
      type="rejected"
      title="Driver profile not found"
      message="We could not find a driver application for this account. Please submit your driver application first."
    />
  );
}

/*
|--------------------------------------------------------------------------
| STAT CARD
|--------------------------------------------------------------------------
*/

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
        {icon}
      </div>

      <p className="text-[10px] uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| AVAILABLE RIDE CARD
|--------------------------------------------------------------------------
*/

function AvailableRideCard({ ride, loading, onAccept }) {
  return (
    <article className="overflow-hidden rounded-[28px] border border-white/[0.07] bg-white/[0.025]">
      <div className="border-b border-white/[0.06] p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-600">
              New ride request
            </p>

            <p className="mt-1 text-sm font-bold">
              {ride.passenger?.name || "Passenger"}
            </p>
          </div>

          <div className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm font-bold text-emerald-300">
            ৳{Number(ride.estimatedFare || 0).toFixed(0)}
          </div>
        </div>
      </div>

      <div className="p-5">
        <RouteDisplay
          pickup={ride.pickup?.address}
          destination={ride.destination?.address}
        />

        <div className="mt-5 grid grid-cols-3 gap-2">
          <SmallMetric
            icon={<Route size={13} />}
            label="Distance"
            value={`${Number(ride.distanceKm || 0).toFixed(1)} km`}
          />

          <SmallMetric
            icon={<Clock3 size={13} />}
            label="Duration"
            value={`${Math.round(ride.durationMinutes || 0)}m`}
          />

          <SmallMetric
            icon={<Car size={13} />}
            label="Vehicle"
            value={ride.vehicleType || "car"}
          />
        </div>

        <button
          type="button"
          onClick={() => onAccept(ride._id)}
          disabled={loading}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-4 py-4 text-sm font-bold transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw size={17} className="animate-spin" />
              Accepting...
            </>
          ) : (
            <>
              Accept ride
              <ArrowRight size={17} />
            </>
          )}
        </button>
      </div>
    </article>
  );
}

/*
|--------------------------------------------------------------------------
| ACTIVE RIDE CARD
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
    <article className="overflow-hidden rounded-[28px] border border-indigo-500/20 bg-indigo-500/[0.04]">
      <div className="flex items-center justify-between border-b border-white/[0.06] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
            <Car size={20} />
          </div>

          <div>
            <p className="text-xs text-slate-600">Current passenger</p>

            <p className="font-semibold">
              {ride.passenger?.name || "Passenger"}
            </p>
          </div>
        </div>

        <StatusBadge status={ride.status} />
      </div>

      <div className="p-5">
        <RouteDisplay
          pickup={ride.pickup?.address}
          destination={ride.destination?.address}
        />

        <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/[0.06] bg-black/10 p-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06]">
              <User size={16} className="text-slate-400" />
            </div>

            <div>
              <p className="text-xs text-slate-600">Passenger</p>

              <p className="text-sm font-medium">
                {ride.passenger?.name || "Passenger"}
              </p>
            </div>
          </div>

          {ride.passenger?.phone && (
            <a
              href={`tel:${ride.passenger.phone}`}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400"
              title="Call passenger"
            >
              <Phone size={16} />
            </a>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <SmallMetric
            icon={<DollarSign size={13} />}
            label="Fare"
            value={`৳${Number(ride.estimatedFare || 0).toFixed(0)}`}
          />

          <SmallMetric
            icon={<Route size={13} />}
            label="Distance"
            value={`${Number(ride.distanceKm || 0).toFixed(1)} km`}
          />

          <SmallMetric
            icon={<Clock3 size={13} />}
            label="Duration"
            value={`${Math.round(ride.durationMinutes || 0)}m`}
          />
        </div>

        <button
          type="button"
          onClick={() => onAction(ride)}
          disabled={loading}
          className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-bold transition disabled:opacity-50 ${
            ride.status === "in_progress"
              ? "bg-emerald-500 hover:bg-emerald-400"
              : "bg-indigo-500 hover:bg-indigo-400"
          }`}
        >
          {loading ? (
            <>
              <RefreshCw size={17} className="animate-spin" />
              Updating...
            </>
          ) : (
            <>
              {ride.status === "accepted" && <Navigation size={17} />}

              {ride.status === "driver_arriving" && <Car size={17} />}

              {ride.status === "in_progress" && <CheckCircle2 size={17} />}

              {actionLabel}

              <ArrowRight size={17} />
            </>
          )}
        </button>
      </div>
    </article>
  );
}

/*
|--------------------------------------------------------------------------
| ROUTE DISPLAY
|--------------------------------------------------------------------------
*/

function RouteDisplay({ pickup, destination }) {
  return (
    <div className="relative">
      <div className="absolute bottom-5 left-[9px] top-5 w-px bg-gradient-to-b from-emerald-400/60 via-white/10 to-red-400/60" />

      <div className="relative flex gap-3">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/10" />
        </div>

        <div className="min-w-0 flex-1 pb-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
            Pickup
          </p>

          <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-300">
            {pickup || "Pickup location"}
          </p>
        </div>
      </div>

      <div className="relative flex gap-3">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400 ring-4 ring-red-400/10" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
            Destination
          </p>

          <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-300">
            {destination || "Destination"}
          </p>
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| SMALL METRIC
|--------------------------------------------------------------------------
*/

function SmallMetric({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-black/10 px-2 py-2.5 text-center">
      <div className="flex items-center justify-center gap-1 text-slate-600">
        {icon}

        <span className="text-[9px]">{label}</span>
      </div>

      <p className="mt-1 text-xs font-semibold text-slate-300">{value}</p>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| STATUS BADGE
|--------------------------------------------------------------------------
*/

function StatusBadge({ status }) {
  const config = {
    accepted: {
      label: "Accepted",
      className: "bg-indigo-500/10 text-indigo-300",
    },

    driver_arriving: {
      label: "Arriving",
      className: "bg-amber-500/10 text-amber-300",
    },

    in_progress: {
      label: "In progress",
      className: "bg-emerald-500/10 text-emerald-300",
    },
  };

  const current = config[status] || {
    label: status || "Unknown",
    className: "bg-white/5 text-slate-400",
  };

  return (
    <span
      className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${current.className}`}
    >
      {current.label}
    </span>
  );
}

/*
|--------------------------------------------------------------------------
| INFO ROW
|--------------------------------------------------------------------------
*/

function InfoRow({ label, value }) {
  return (
    <div className="border-b border-white/[0.05] py-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <p className="mt-1 text-xs font-semibold text-slate-300">{value}</p>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| STATUS ICON
|--------------------------------------------------------------------------
*/

function StatusIcon({ status }) {
  if (status === "approved") {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
        <CheckCircle2 size={19} />
      </div>
    );
  }

  if (status === "rejected" || status === "suspended") {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
        <XCircle size={19} />
      </div>
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
      <Clock3 size={19} />
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| STATUS LABEL
|--------------------------------------------------------------------------
*/

function getStatusLabel(status) {
  if (status === "approved") {
    return "Approved";
  }

  if (status === "rejected") {
    return "Rejected";
  }

  if (status === "suspended") {
    return "Suspended";
  }

  if (status === "pending") {
    return "Pending approval";
  }

  return "Not submitted";
}

/*
|--------------------------------------------------------------------------
| INITIALS
|--------------------------------------------------------------------------
*/

function getInitials(name) {
  if (!name) {
    return "DR";
  }

  const parts = String(name).trim().split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/*
|--------------------------------------------------------------------------
| FIRST NAME
|--------------------------------------------------------------------------
*/

function firstName(name) {
  if (!name) {
    return "Driver";
  }

  return String(name).trim().split(/\s+/)[0];
}
