import { useCallback, useEffect, useRef, useState } from "react";

import {
  ArrowRight,
  Car,
  CheckCircle2,
  Clock3,
  DollarSign,
  LogOut,
  LocateFixed,
  Navigation,
  Phone,
  RefreshCw,
  Route,
  Star,
  User,
  Wifi,
  WifiOff,
  XCircle,
  Zap,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

import {
  acceptRide,
  completeRide,
  getAvailableRides,
  getDriverRides,
  markDriverArriving,
  startRide,
} from "../../services/rideService";

/*
|--------------------------------------------------------------------------
| CONFIG
|--------------------------------------------------------------------------
*/

const API_TIMEOUT = 8000;
const RIDE_REFRESH_MS = 15000;
const GPS_INTERVAL_MS = 5000;

/*
|--------------------------------------------------------------------------
| SAFE API REQUEST
|--------------------------------------------------------------------------
*/

async function requestWithTimeout(request, timeout = API_TIMEOUT) {
  let timer = null;

  try {
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => {
        const error = new Error("Request timed out.");

        error.code = "REQUEST_TIMEOUT";

        reject(error);
      }, timeout);
    });

    return await Promise.race([request, timeoutPromise]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

/*
|--------------------------------------------------------------------------
| DRIVER DASHBOARD
|--------------------------------------------------------------------------
*/

export default function DriverDashboard() {
  const { user, logout } = useAuth();

  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [driver, setDriver] = useState(null);

  const [availableRides, setAvailableRides] = useState([]);

  const [activeRides, setActiveRides] = useState([]);

  /*
   * IMPORTANT:
   *
   * Dashboard does NOT start in loading mode.
   *
   * It can render while the driver profile is being requested.
   */
  const [loading, setLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const [actionLoading, setActionLoading] = useState(null);

  const [onlineLoading, setOnlineLoading] = useState(false);

  const [locationLoading, setLocationLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [location, setLocation] = useState(null);

  const [locationPermission, setLocationPermission] = useState("unknown");

  /*
  |--------------------------------------------------------------------------
  | REFS
  |--------------------------------------------------------------------------
  */

  const mountedRef = useRef(false);

  const driverRef = useRef(null);

  const watchIdRef = useRef(null);

  const gpsStartedRef = useRef(false);

  const lastLocationSentRef = useRef(0);

  /*
  |--------------------------------------------------------------------------
  | MOUNT / UNMOUNT
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);

        watchIdRef.current = null;
      }

      gpsStartedRef.current = false;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | DRIVER REF
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    driverRef.current = driver;
  }, [driver]);

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  const showError = useCallback((message) => {
    if (!mountedRef.current) {
      return;
    }

    setError(message || "Something went wrong.");

    setSuccess("");
  }, []);

  /*
  |--------------------------------------------------------------------------
  | SUCCESS
  |--------------------------------------------------------------------------
  */

  const showSuccess = useCallback((message) => {
    if (!mountedRef.current) {
      return;
    }

    setSuccess(message || "Operation successful.");

    setError("");

    window.setTimeout(() => {
      if (mountedRef.current) {
        setSuccess("");
      }
    }, 4000);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | LOAD DRIVER
  |--------------------------------------------------------------------------
  */

  const loadDriver = useCallback(async () => {
    try {
      const response = await requestWithTimeout(api.get("/drivers/me"));

      const driverData = response.data?.driver || null;

      if (!driverData) {
        throw new Error("Driver profile was not returned by the server.");
      }

      if (mountedRef.current) {
        driverRef.current = driverData;

        setDriver(driverData);
      }

      return driverData;
    } catch (err) {
      console.error("Driver profile error:", err);

      /*
       * IMPORTANT:
       *
       * Never throw this error back into the initialization
       * chain.
       *
       * The dashboard must always be able to render.
       */

      if (err.response?.status === 403) {
        showError(
          err.response?.data?.message ||
            "Your driver account is not currently authorized.",
        );
      } else if (err.response?.status === 401) {
        showError("Your login session is invalid or expired.");
      } else if (err.code === "REQUEST_TIMEOUT") {
        showError("The Gontobbo server took too long to respond.");
      } else {
        showError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load driver profile.",
        );
      }

      return null;
    }
  }, [showError]);

  /*
  |--------------------------------------------------------------------------
  | LOAD RIDES
  |--------------------------------------------------------------------------
  */

  const loadRides = useCallback(async () => {
    const currentDriver = driverRef.current;

    /*
     * Only approved drivers should access driver ride endpoints.
     */

    if (!currentDriver || currentDriver.status !== "approved") {
      if (mountedRef.current) {
        setAvailableRides([]);

        setActiveRides([]);
      }

      return;
    }

    try {
      const result = await Promise.allSettled([
        requestWithTimeout(getAvailableRides()),

        requestWithTimeout(getDriverRides()),
      ]);

      if (!mountedRef.current) {
        return;
      }

      const available = result[0];

      const active = result[1];

      if (available.status === "fulfilled") {
        setAvailableRides(available.value?.rides || []);
      }

      if (active.status === "fulfilled") {
        setActiveRides(active.value?.rides || []);
      }

      /*
       * 403 from ride endpoints should not
       * prevent the dashboard from rendering.
       */

      if (available.status === "rejected" || active.status === "rejected") {
        console.warn("One or more ride requests failed.", {
          available,
          active,
        });
      }
    } catch (err) {
      console.error("Ride loading error:", err);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | NO initialLoadRef.
  |
  | React StrictMode intentionally mounts/unmounts effects during
  | development. The previous ref caused the second effect to skip
  | initialization while the first effect had already been cancelled.
  |
  */

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      /*
       * Keep dashboard visible.
       */

      if (mountedRef.current) {
        setLoading(true);
      }

      try {
        const driverData = await loadDriver();

        /*
         * Component may have been unmounted.
         */

        if (cancelled) {
          return;
        }

        /*
         * Only load rides for approved drivers.
         */

        if (driverData?.status === "approved") {
          await loadRides();
        }
      } catch (err) {
        /*
         * Absolute last-resort protection.
         */

        console.error("Dashboard initialization error:", err);
      } finally {
        /*
         * THIS IS THE IMPORTANT PART.
         *
         * Loading is ALWAYS turned off.
         */

        if (!cancelled && mountedRef.current) {
          setLoading(false);
        }
      }
    };

    initialize();

    /*
     * Hard safety timeout.
     *
     * This timer is deliberately NOT tied to the request promise.
     */

    const safetyTimer = window.setTimeout(() => {
      if (mountedRef.current) {
        setLoading(false);
      }
    }, 10000);

    return () => {
      cancelled = true;

      window.clearTimeout(safetyTimer);
    };
  }, [loadDriver, loadRides]);

  /*
  |--------------------------------------------------------------------------
  | AUTO RIDE REFRESH
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (driver?.status !== "approved") {
      return undefined;
    }

    const interval = window.setInterval(() => {
      loadRides();
    }, RIDE_REFRESH_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [driver?.status, loadRides]);

  /*
  |--------------------------------------------------------------------------
  | GET CURRENT LOCATION
  |--------------------------------------------------------------------------
  */

  const getCurrentPosition = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));

        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,

        timeout: 10000,

        maximumAge: 5000,
      });
    });
  }, []);

  /*
  |--------------------------------------------------------------------------
  | SEND LOCATION
  |--------------------------------------------------------------------------
  */

  const sendLocation = useCallback(async (position, force = false) => {
    if (!position?.coords) {
      return;
    }

    const latitude = Number(position.coords.latitude);

    const longitude = Number(position.coords.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return;
    }

    const now = Date.now();

    if (!force && now - lastLocationSentRef.current < GPS_INTERVAL_MS) {
      return;
    }

    lastLocationSentRef.current = now;

    if (mountedRef.current) {
      setLocation({
        latitude,
        longitude,
        accuracy: Number(position.coords.accuracy || 0),
        updatedAt: new Date(),
      });
    }

    try {
      await requestWithTimeout(
        api.patch("/drivers/location", {
          latitude,
          longitude,
        }),
      );
    } catch (err) {
      console.warn("Location update failed:", err);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | STOP GPS
  |--------------------------------------------------------------------------
  */

  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);

      watchIdRef.current = null;
    }

    gpsStartedRef.current = false;
  }, []);

  /*
  |--------------------------------------------------------------------------
  | START GPS
  |--------------------------------------------------------------------------
  */

  const startLocationTracking = useCallback(async () => {
    if (gpsStartedRef.current) {
      return true;
    }

    try {
      setLocationLoading(true);

      const position = await getCurrentPosition();

      setLocationPermission("granted");

      await sendLocation(position, true);

      const watchId = navigator.geolocation.watchPosition(
        (nextPosition) => {
          sendLocation(nextPosition, false);
        },
        (geoError) => {
          console.warn("GPS error:", geoError);

          if (geoError.code === 1) {
            setLocationPermission("denied");
          }
        },
        {
          enableHighAccuracy: true,

          timeout: 10000,

          maximumAge: 5000,
        },
      );

      watchIdRef.current = watchId;

      gpsStartedRef.current = true;

      return true;
    } catch (err) {
      console.error("GPS startup error:", err);

      if (err.code === 1) {
        setLocationPermission("denied");
      }

      throw err;
    } finally {
      if (mountedRef.current) {
        setLocationLoading(false);
      }
    }
  }, [getCurrentPosition, sendLocation]);

  /*
  |--------------------------------------------------------------------------
  | GO ONLINE
  |--------------------------------------------------------------------------
  */

  const handleGoOnline = async () => {
    try {
      setOnlineLoading(true);

      setError("");

      await startLocationTracking();

      await requestWithTimeout(api.patch("/drivers/go-online"));

      const updatedDriver = {
        ...(driverRef.current || {}),
        isAvailable: true,
      };

      driverRef.current = updatedDriver;

      if (mountedRef.current) {
        setDriver(updatedDriver);
      }

      showSuccess("You are now online.");

      await loadRides();
    } catch (err) {
      console.error("Go online error:", err);

      stopLocationTracking();

      showError(
        err.response?.data?.message || err.message || "Unable to go online.",
      );
    } finally {
      if (mountedRef.current) {
        setOnlineLoading(false);
      }
    }
  };

  /*
  |--------------------------------------------------------------------------
  | GO OFFLINE
  |--------------------------------------------------------------------------
  */

  const handleGoOffline = async () => {
    try {
      setOnlineLoading(true);

      stopLocationTracking();

      await requestWithTimeout(api.patch("/drivers/go-offline"));

      const updatedDriver = {
        ...(driverRef.current || {}),
        isAvailable: false,
      };

      driverRef.current = updatedDriver;

      if (mountedRef.current) {
        setDriver(updatedDriver);

        setAvailableRides([]);
      }

      showSuccess("You are now offline.");
    } catch (err) {
      console.error("Go offline error:", err);

      showError(err.response?.data?.message || "Unable to go offline.");
    } finally {
      if (mountedRef.current) {
        setOnlineLoading(false);
      }
    }
  };

  /*
  |--------------------------------------------------------------------------
  | MANUAL REFRESH
  |--------------------------------------------------------------------------
  */

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      setError("");

      const driverData = await loadDriver();

      if (driverData?.status === "approved") {
        await loadRides();
      }
    } finally {
      if (mountedRef.current) {
        setRefreshing(false);
      }
    }
  };

  /*
  |--------------------------------------------------------------------------
  | ACCEPT RIDE
  |--------------------------------------------------------------------------
  */

  const handleAcceptRide = async (rideId) => {
    try {
      setActionLoading(rideId);

      await acceptRide(rideId);

      showSuccess("Ride accepted.");

      await loadRides();
    } catch (err) {
      console.error("Accept ride error:", err);

      showError(err.response?.data?.message || "Unable to accept ride.");
    } finally {
      setActionLoading(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | RIDE ACTION
  |--------------------------------------------------------------------------
  */

  const handleRideAction = async (ride) => {
    try {
      setActionLoading(ride._id);

      if (ride.status === "accepted") {
        await markDriverArriving(ride._id);

        showSuccess("Passenger notified that you are arriving.");
      } else if (ride.status === "driver_arriving") {
        await startRide(ride._id);

        showSuccess("Ride started.");
      } else if (ride.status === "in_progress") {
        await completeRide(ride._id);

        showSuccess("Ride completed.");
      }

      await loadRides();
    } catch (err) {
      console.error("Ride action error:", err);

      showError(err.response?.data?.message || "Unable to update ride.");
    } finally {
      setActionLoading(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  const handleLogout = async () => {
    stopLocationTracking();

    try {
      if (driverRef.current?.isAvailable) {
        await requestWithTimeout(api.patch("/drivers/go-offline"));
      }
    } catch (err) {
      console.warn("Could not mark driver offline:", err);
    }

    logout();
  };

  /*
  |--------------------------------------------------------------------------
  | DERIVED DATA
  |--------------------------------------------------------------------------
  */

  const isApproved = driver?.status === "approved";

  const isOnline = driver?.isAvailable === true;

  const totalRides = Number(driver?.totalRides || 0);

  const rating = Number(driver?.rating || 5);

  const activeValue = activeRides.reduce(
    (total, ride) => total + Number(ride.estimatedFare || 0),
    0,
  );

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  |
  | Because initialization can no longer get stuck,
  | this screen is now only a short transitional state.
  |
  */

  if (loading && !driver) {
    return (
      <div className="min-h-screen bg-[#07111f] px-4 py-10 text-white">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center justify-between">
            <div className="h-10 w-40 animate-pulse rounded-xl bg-white/5" />

            <div className="h-10 w-10 animate-pulse rounded-xl bg-white/5" />
          </div>

          <div className="rounded-[28px] border border-white/[0.07] bg-white/[0.025] p-8">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <RefreshCw
                size={30}
                className="mb-5 animate-spin text-indigo-400"
              />

              <h2 className="text-lg font-bold">Loading your dashboard...</h2>

              <p className="mt-2 text-sm text-slate-500">
                Connecting to Gontobbo server
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | MAIN DASHBOARD
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#07111f]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/20">
              <Car size={21} />
            </div>

            <div>
              <h1 className="text-base font-bold">Gontobbo</h1>

              <p className="text-[11px] text-slate-500">Driver workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{user?.name || "Driver"}</p>

              <p className="text-xs text-slate-500">
                {user?.email || "Driver account"}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-sm font-bold text-slate-300">
              {getInitials(user?.name)}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] text-slate-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ERROR */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/[0.07] px-4 py-3.5 text-sm text-red-300">
            <XCircle size={18} className="mt-0.5 shrink-0" />

            <span className="flex-1">{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-lg text-red-400"
            >
              ×
            </button>
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.07] px-4 py-3.5 text-sm text-emerald-300">
            <CheckCircle2 size={18} />

            {success}
          </div>
        )}

        {/* HERO */}

        <section className="mb-6 overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-indigo-500/[0.13] via-white/[0.025] to-transparent">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-slate-400">
                  <Zap size={13} />
                  Driver mode
                </div>

                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Welcome,
                  <span className="text-indigo-400">
                    {" "}
                    {firstName(user?.name)}
                  </span>
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                  Manage your driver account, rides and availability.
                </p>
              </div>

              {/* ONLINE CONTROL */}

              <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">Driver status</p>

                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          isOnline ? "bg-emerald-400" : "bg-slate-600"
                        }`}
                      />

                      <p className="text-sm font-bold">
                        {isOnline ? "Online" : "Offline"}
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-white/5 px-3 py-1.5 text-[11px] text-slate-400">
                    {isOnline ? "Accepting rides" : "Not accepting"}
                  </span>
                </div>

                {isApproved ? (
                  <button
                    type="button"
                    disabled={onlineLoading || locationLoading}
                    onClick={isOnline ? handleGoOffline : handleGoOnline}
                    className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-bold transition disabled:opacity-50 ${
                      isOnline
                        ? "border border-white/[0.08] bg-white/[0.05] hover:bg-white/[0.09]"
                        : "bg-emerald-500 hover:bg-emerald-400"
                    }`}
                  >
                    {onlineLoading || locationLoading ? (
                      <>
                        <RefreshCw size={17} className="animate-spin" />
                        Updating...
                      </>
                    ) : isOnline ? (
                      <>
                        <WifiOff size={17} />
                        Go Offline
                      </>
                    ) : (
                      <>
                        <Wifi size={17} />
                        Go Online
                      </>
                    )}
                  </button>
                ) : (
                  <div className="rounded-2xl border border-amber-400/10 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-300">
                    {driver
                      ? getDriverStatusMessage(driver.status)
                      : "Driver profile could not be loaded. Check your server and login session."}
                  </div>
                )}

                {isApproved && (
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <LocateFixed
                        size={14}
                        className={
                          location ? "text-emerald-400" : "text-slate-600"
                        }
                      />

                      <span className="text-[11px] text-slate-500">GPS</span>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      {location
                        ? `±${Math.round(location.accuracy || 0)}m`
                        : locationPermission === "denied"
                          ? "Denied"
                          : "Waiting"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}

        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={<Route size={17} />}
            label="Total rides"
            value={totalRides}
          />

          <StatCard
            icon={<Star size={17} />}
            label="Rating"
            value={rating.toFixed(1)}
          />

          <StatCard
            icon={<DollarSign size={17} />}
            label="Active value"
            value={`৳${activeValue.toFixed(0)}`}
          />

          <StatCard
            icon={<Navigation size={17} />}
            label="Nearby rides"
            value={availableRides.length}
          />
        </section>

        {/* DRIVER PROFILE */}

        <section className="mb-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon status={driver?.status} />

              <div>
                <p className="text-xs text-slate-500">Driver application</p>

                <p className="mt-1 text-sm font-bold">
                  {getStatusLabel(driver?.status)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <InfoPill label="Vehicle" value={driver?.vehicle?.type || "—"} />

              <InfoPill label="Model" value={driver?.vehicle?.model || "—"} />

              <InfoPill
                label="Registration"
                value={driver?.vehicle?.registrationNumber || "—"}
              />
            </div>
          </div>
        </section>

        {/* RIDE HEADER */}

        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Ride requests</h3>

            <p className="mt-1 text-xs text-slate-500">
              {isOnline
                ? "Passenger requests will appear here."
                : "Go online to receive passenger requests."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-slate-300 disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* NO DRIVER */}

        {!driver && (
          <EmptyState
            icon={<XCircle size={25} />}
            title="Driver profile unavailable"
            message="The dashboard loaded, but the driver profile could not be retrieved from the server."
          />
        )}

        {/* NOT APPROVED */}

        {driver && !isApproved && (
          <EmptyState
            icon={<Clock3 size={25} />}
            title={getStatusLabel(driver.status)}
            message={getDriverStatusMessage(driver.status)}
          />
        )}

        {/* OFFLINE */}

        {driver && isApproved && !isOnline && (
          <EmptyState
            icon={<WifiOff size={25} />}
            title="You are offline"
            message="Go online to start receiving passenger requests."
            action={
              <button
                type="button"
                onClick={handleGoOnline}
                disabled={onlineLoading || locationLoading}
                className="mt-5 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold disabled:opacity-50"
              >
                Go Online
              </button>
            }
          />
        )}

        {/* AVAILABLE RIDES */}

        {driver && isApproved && isOnline && availableRides.length > 0 && (
          <section className="grid gap-4 lg:grid-cols-2">
            {availableRides.map((ride) => (
              <AvailableRideCard
                key={ride._id}
                ride={ride}
                loading={actionLoading === ride._id}
                onAccept={() => handleAcceptRide(ride._id)}
              />
            ))}
          </section>
        )}

        {driver && isApproved && isOnline && availableRides.length === 0 && (
          <EmptyState
            icon={<Navigation size={25} />}
            title="No ride requests"
            message="You are online. New nearby passenger requests will appear here."
          />
        )}

        {/* ACTIVE RIDES */}

        {activeRides.length > 0 && (
          <section className="mt-8">
            <div className="mb-4">
              <h3 className="text-lg font-bold">Active rides</h3>

              <p className="mt-1 text-xs text-slate-500">
                Your current passenger trips.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {activeRides.map((ride) => (
                <ActiveRideCard
                  key={ride._id}
                  ride={ride}
                  loading={actionLoading === ride._id}
                  onAction={() => handleRideAction(ride)}
                />
              ))}
            </div>
          </section>
        )}
      </main>
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
    <article className="overflow-hidden rounded-[24px] border border-white/[0.07] bg-white/[0.025]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-600">
            New ride
          </p>

          <p className="mt-1 text-sm font-bold text-indigo-300">
            Passenger request
          </p>
        </div>

        <div className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
          ৳{Number(ride.estimatedFare || 0).toFixed(0)}
        </div>
      </div>

      <div className="p-5">
        <RouteDisplay
          pickup={ride.pickup?.address}
          destination={ride.destination?.address}
        />

        <div className="mt-5 grid grid-cols-3 gap-2">
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

        <div className="mt-5 flex items-center justify-between rounded-xl border border-white/[0.05] bg-black/10 px-3 py-3">
          <div className="flex items-center gap-2">
            <User size={15} className="text-slate-500" />

            <div>
              <p className="text-[10px] text-slate-600">Passenger</p>

              <p className="text-xs font-semibold text-slate-300">
                {ride.passenger?.name || "Passenger"}
              </p>
            </div>
          </div>

          {ride.passenger?.phone && (
            <a
              href={`tel:${ride.passenger.phone}`}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400"
            >
              <Phone size={15} />
            </a>
          )}
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={onAccept}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-4 py-4 text-sm font-bold hover:bg-indigo-400 disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw size={17} className="animate-spin" />
              Accepting...
            </>
          ) : (
            <>
              Accept Ride
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
      ? "I'm Arriving"
      : ride.status === "driver_arriving"
        ? "Start Ride"
        : "Complete Ride";

  return (
    <article className="rounded-[24px] border border-indigo-400/10 bg-indigo-500/[0.035]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-600">
            Active ride
          </p>

          <p className="mt-1 text-sm font-bold">
            {ride.passenger?.name || "Passenger"}
          </p>
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
            <User size={17} className="text-slate-500" />

            <div>
              <p className="text-[10px] text-slate-600">Passenger</p>

              <p className="text-sm font-medium">
                {ride.passenger?.name || "Passenger"}
              </p>
            </div>
          </div>

          {ride.passenger?.phone && (
            <a
              href={`tel:${ride.passenger.phone}`}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400"
            >
              <Phone size={16} />
            </a>
          )}
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={onAction}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-4 py-4 text-sm font-bold hover:bg-indigo-400 disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw size={17} className="animate-spin" />
              Updating...
            </>
          ) : (
            <>
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
      <div className="absolute bottom-5 left-[9px] top-5 w-px bg-white/10" />

      <div className="relative flex gap-3">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>

        <div className="min-w-0 flex-1 pb-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-600">
            Pickup
          </p>

          <p className="mt-1 text-sm text-slate-300">
            {pickup || "Pickup location"}
          </p>
        </div>
      </div>

      <div className="relative flex gap-3">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-slate-600">
            Destination
          </p>

          <p className="mt-1 text-sm text-slate-300">
            {destination || "Destination"}
          </p>
        </div>
      </div>
    </div>
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
      <div className="flex items-center gap-2 text-slate-600">
        {icon}

        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>

      <p className="mt-2 text-xl font-bold text-slate-200">{value}</p>
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
| INFO PILL
|--------------------------------------------------------------------------
*/

function InfoPill({ label, value }) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-black/10 px-3 py-2">
      <span className="text-[9px] uppercase tracking-wider text-slate-600">
        {label}
      </span>

      <p className="mt-0.5 max-w-[180px] truncate text-xs font-semibold text-slate-300">
        {value}
      </p>
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
| STATUS BADGE
|--------------------------------------------------------------------------
*/

function StatusBadge({ status }) {
  const map = {
    accepted: ["Accepted", "bg-indigo-500/10 text-indigo-300"],

    driver_arriving: ["Arriving", "bg-amber-500/10 text-amber-300"],

    in_progress: ["In progress", "bg-emerald-500/10 text-emerald-300"],
  };

  const item = map[status] || [
    status || "Unknown",
    "bg-white/5 text-slate-400",
  ];

  return (
    <span
      className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${item[1]}`}
    >
      {item[0]}
    </span>
  );
}

/*
|--------------------------------------------------------------------------
| EMPTY STATE
|--------------------------------------------------------------------------
*/

function EmptyState({ icon, title, message, action }) {
  return (
    <section className="rounded-[28px] border border-white/[0.07] bg-white/[0.025] p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
        {icon}
      </div>

      <h3 className="text-lg font-bold">{title}</h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {message}
      </p>

      {action}
    </section>
  );
}

/*
|--------------------------------------------------------------------------
| DRIVER STATUS LABEL
|--------------------------------------------------------------------------
*/

function getStatusLabel(status) {
  if (status === "approved") {
    return "Approved";
  }

  if (status === "pending") {
    return "Pending approval";
  }

  if (status === "rejected") {
    return "Rejected";
  }

  if (status === "suspended") {
    return "Suspended";
  }

  return "Driver profile unavailable";
}

/*
|--------------------------------------------------------------------------
| DRIVER STATUS MESSAGE
|--------------------------------------------------------------------------
*/

function getDriverStatusMessage(status) {
  if (status === "pending") {
    return "Your driver application is waiting for administrator approval.";
  }

  if (status === "rejected") {
    return "Your driver application was rejected. Please review the reason and update your application.";
  }

  if (status === "suspended") {
    return "Your driver account is currently suspended.";
  }

  return "Your driver account is not currently available.";
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

  const parts = String(name).trim().split(/\s+/);

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
