import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Bike,
  Car,
  CheckCircle2,
  Clock3,
  DollarSign,
  Loader2,
  LogOut,
  Menu,
  Navigation,
  Phone,
  RefreshCw,
  ShieldCheck,
  Star,
  User,
  Wifi,
  WifiOff,
  X,
  XCircle,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import MapView from "../../components/ui/MapView";

import {
  acceptRide,
  rejectRide,
  markDriverArriving,
  startRide,
  completeRide,
  getAvailableRides,
  getDriverRides,
  setDriverOnline,
  setDriverOffline,
  updateDriverLocation,
} from "../../services/rideService";

const POLL_INTERVAL = 4000;

export default function DriverDashboard() {
  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");

  const [online, setOnline] = useState(user?.online ?? user?.isOnline ?? false);

  const [statusUpdating, setStatusUpdating] = useState(false);

  const [locationStatus, setLocationStatus] = useState(
    "Location not shared yet",
  );

  const [currentLocation, setCurrentLocation] = useState(null);

  const [availableRides, setAvailableRides] = useState([]);
  const [driverRides, setDriverRides] = useState([]);
  const [activeRide, setActiveRide] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionRideId, setActionRideId] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  /*
  |--------------------------------------------------------------------------
  | GPS
  |--------------------------------------------------------------------------
  */

  const sendCurrentPosition = useCallback(async (position) => {
    const latitude = position?.coords?.latitude;
    const longitude = position?.coords?.longitude;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new Error("GPS returned an invalid location.");
    }

    setCurrentLocation({
      latitude,
      longitude,
    });

    setLocationStatus("Location updated");

    await updateDriverLocation(latitude, longitude);
  }, []);

  const getCurrentPosition = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      });
    });
  }, []);

  useEffect(() => {
    if (!online || !navigator.geolocation) {
      return undefined;
    }

    let watchId = null;

    const handlePosition = async (position) => {
      try {
        await sendCurrentPosition(position);
      } catch (error) {
        console.error("Driver location update error:", error);
        setLocationStatus("Unable to update GPS location");
      }
    };

    const handlePositionError = (error) => {
      console.error("Driver GPS error:", error);

      if (error?.code === 1) {
        setLocationStatus("Location permission denied");
      } else if (error?.code === 2) {
        setLocationStatus("Unable to determine your location");
      } else if (error?.code === 3) {
        setLocationStatus("GPS request timed out");
      } else {
        setLocationStatus("GPS unavailable");
      }
    };

    watchId = navigator.geolocation.watchPosition(
      handlePosition,
      handlePositionError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    );

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [online, sendCurrentPosition]);

  /*
  |--------------------------------------------------------------------------
  | LOAD DRIVER DATA
  |--------------------------------------------------------------------------
  */

  const loadDriverData = useCallback(
    async (silent = false) => {
      if (!online) {
        setAvailableRides([]);

        if (!silent) {
          setLoading(false);
        }

        try {
          const historyResponse = await getDriverRides();

          const history =
            historyResponse?.rides || historyResponse?.data?.rides || [];

          const safeHistory = Array.isArray(history) ? history : [];

          setDriverRides(safeHistory);

          const currentRide =
            safeHistory.find((ride) =>
              ["accepted", "driver_arriving", "in_progress"].includes(
                ride.status,
              ),
            ) || null;

          setActiveRide(currentRide);
        } catch (error) {
          console.error("Driver history error:", error);
        }

        return;
      }

      try {
        if (!silent) {
          setLoading(true);
        }

        const [availableResponse, historyResponse] = await Promise.all([
          getAvailableRides(),
          getDriverRides(),
        ]);

        const available =
          availableResponse?.rides || availableResponse?.data?.rides || [];

        const history =
          historyResponse?.rides || historyResponse?.data?.rides || [];

        setAvailableRides(Array.isArray(available) ? available : []);
        setDriverRides(Array.isArray(history) ? history : []);

        const currentRide = Array.isArray(history)
          ? history.find((ride) =>
              ["accepted", "driver_arriving", "in_progress"].includes(
                ride.status,
              ),
            )
          : null;

        setActiveRide(currentRide || null);
      } catch (error) {
        console.error("Driver dashboard error:", error);

        if (!silent) {
          setAvailableRides([]);
          setDriverRides([]);
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [online],
  );

  useEffect(() => {
    loadDriverData();

    const interval = window.setInterval(() => {
      loadDriverData(true);
    }, POLL_INTERVAL);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadDriverData]);

  /*
  |--------------------------------------------------------------------------
  | ONLINE / OFFLINE
  |--------------------------------------------------------------------------
  */

  const handleOnlineToggle = async () => {
    if (statusUpdating) {
      return;
    }

    try {
      setStatusUpdating(true);
      setStatusMessage("");

      if (online) {
        await setDriverOffline();

        setOnline(false);
        setAvailableRides([]);
        setStatusMessage("You are now offline.");
      } else {
        if (!navigator.geolocation) {
          throw new Error(
            "Location services are not supported by this browser.",
          );
        }

        setLocationStatus("Getting your current location...");

        let position;

        try {
          position = await getCurrentPosition();
        } catch (locationError) {
          console.error("Initial driver GPS error:", locationError);

          if (locationError?.code === 1) {
            throw new Error(
              "Location permission was denied. Please allow location access and try again.",
            );
          }

          if (locationError?.code === 2) {
            throw new Error(
              "Your current location could not be determined. Please check your GPS and try again.",
            );
          }

          if (locationError?.code === 3) {
            throw new Error(
              "Getting your location timed out. Please try again.",
            );
          }

          throw new Error("Unable to get your current location.");
        }

        await sendCurrentPosition(position);
        await setDriverOnline();

        setOnline(true);
        setStatusMessage("You are now online and ready for rides.");
      }
    } catch (error) {
      console.error("Driver online/offline error:", error);

      setStatusMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to update your availability.",
      );
    } finally {
      setStatusUpdating(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | SIDEBAR NAVIGATION
  |--------------------------------------------------------------------------
  */

  const handleSidebarNavigation = (section) => {
    setActiveSection(section);
    setSidebarOpen(false);

    window.setTimeout(() => {
      const element = document.getElementById(section);

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 50);
  };

  /*
  |--------------------------------------------------------------------------
  | ACCEPT
  |--------------------------------------------------------------------------
  */

  const handleAccept = async (ride) => {
    const rideId = ride._id || ride.id;

    try {
      setActionRideId(rideId);
      setStatusMessage("");

      const response = await acceptRide(rideId);

      const acceptedRide = response?.ride ||
        response?.data?.ride || {
          ...ride,
          status: "accepted",
        };

      setActiveRide(acceptedRide);

      setAvailableRides((current) =>
        current.filter((item) => (item._id || item.id) !== rideId),
      );

      setStatusMessage("Ride accepted. Please mark yourself as arriving.");

      await loadDriverData(true);
    } catch (error) {
      console.error("Accept ride error:", error);

      setStatusMessage(
        error?.response?.data?.message || "Unable to accept this ride.",
      );
    } finally {
      setActionRideId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | REJECT
  |--------------------------------------------------------------------------
  */

  const handleReject = async (ride) => {
    const rideId = ride._id || ride.id;

    try {
      setActionRideId(rideId);
      setStatusMessage("");

      await rejectRide(rideId);

      setAvailableRides((current) =>
        current.filter((item) => (item._id || item.id) !== rideId),
      );

      setStatusMessage("Ride request rejected.");
    } catch (error) {
      console.error("Reject ride error:", error);

      setStatusMessage(
        error?.response?.data?.message || "Unable to reject this ride.",
      );
    } finally {
      setActionRideId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | ARRIVING
  |--------------------------------------------------------------------------
  */

  const handleDriverArriving = async () => {
    if (!activeRide) {
      return;
    }

    const rideId = activeRide._id || activeRide.id;

    try {
      setActionRideId(rideId);
      setStatusMessage("");

      const response = await markDriverArriving(rideId);

      const updatedRide = response?.ride ||
        response?.data?.ride || {
          ...activeRide,
          status: "driver_arriving",
        };

      setActiveRide(updatedRide);
      setStatusMessage("You are marked as arriving.");

      await loadDriverData(true);
    } catch (error) {
      console.error("Mark arriving error:", error);

      setStatusMessage(
        error?.response?.data?.message ||
          "Unable to mark yourself as arriving.",
      );
    } finally {
      setActionRideId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | START
  |--------------------------------------------------------------------------
  */

  const handleStartRide = async () => {
    if (!activeRide) {
      return;
    }

    const rideId = activeRide._id || activeRide.id;

    try {
      setActionRideId(rideId);
      setStatusMessage("");

      const response = await startRide(rideId);

      const updatedRide = response?.ride ||
        response?.data?.ride || {
          ...activeRide,
          status: "in_progress",
        };

      setActiveRide(updatedRide);
      setStatusMessage("Ride started.");

      await loadDriverData(true);
    } catch (error) {
      console.error("Start ride error:", error);

      setStatusMessage(
        error?.response?.data?.message || "Unable to start ride.",
      );
    } finally {
      setActionRideId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | COMPLETE
  |--------------------------------------------------------------------------
  */

  const handleCompleteRide = async () => {
    if (!activeRide) {
      return;
    }

    const rideId = activeRide._id || activeRide.id;

    try {
      setActionRideId(rideId);
      setStatusMessage("");

      const response = await completeRide(rideId);

      const completed = response?.ride || response?.data?.ride || null;

      setActiveRide(null);
      setStatusMessage("Ride completed successfully.");

      if (completed) {
        setDriverRides((current) => [
          completed,
          ...current.filter((ride) => (ride._id || ride.id) !== rideId),
        ]);
      }

      await loadDriverData(true);
    } catch (error) {
      console.error("Complete ride error:", error);

      setStatusMessage(
        error?.response?.data?.message || "Unable to complete ride.",
      );
    } finally {
      setActionRideId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadDriverData();
    } finally {
      setRefreshing(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | STATISTICS
  |--------------------------------------------------------------------------
  */

  const completedRides = useMemo(
    () => driverRides.filter((ride) => ride.status === "completed"),
    [driverRides],
  );

  const todayRides = useMemo(() => {
    const now = new Date();

    return completedRides.filter((ride) => {
      const date = new Date(
        ride.completedAt || ride.updatedAt || ride.createdAt,
      );

      return (
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    });
  }, [completedRides]);

  const totalEarnings = useMemo(
    () =>
      completedRides.reduce(
        (total, ride) =>
          total +
          Number(ride.finalFare ?? ride.estimatedFare ?? ride.fare ?? 0),
        0,
      ),
    [completedRides],
  );

  const todayEarnings = useMemo(
    () =>
      todayRides.reduce(
        (total, ride) =>
          total +
          Number(ride.finalFare ?? ride.estimatedFare ?? ride.fare ?? 0),
        0,
      ),
    [todayRides],
  );

  /*
  |--------------------------------------------------------------------------
  | AVERAGE RATING
  |--------------------------------------------------------------------------
  */

  const averageRating = useMemo(() => {
    const directRating =
      user?.rating ??
      user?.averageRating ??
      user?.avgRating ??
      user?.driverRating ??
      user?.driver?.rating ??
      user?.driver?.averageRating ??
      user?.driver?.avgRating ??
      user?.profile?.rating ??
      user?.profile?.averageRating;

    const numericDirectRating = Number(directRating);

    if (
      directRating !== undefined &&
      directRating !== null &&
      directRating !== "" &&
      Number.isFinite(numericDirectRating) &&
      numericDirectRating > 0
    ) {
      return Math.min(5, Math.max(0, numericDirectRating));
    }

    const ratings = completedRides
      .map((ride) => {
        const rating =
          ride.rating ??
          ride.driverRating ??
          ride.passengerRating ??
          ride.review?.rating ??
          ride.review?.driverRating ??
          ride.review?.driverRatingValue;

        const number = Number(rating);

        return Number.isFinite(number) && number > 0 && number <= 5
          ? number
          : null;
      })
      .filter((rating) => rating !== null);

    if (ratings.length === 0) {
      return null;
    }

    const total = ratings.reduce((sum, rating) => sum + rating, 0);

    return total / ratings.length;
  }, [user, completedRides]);

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-950">
      {/* MOBILE OVERLAY */}

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-1050 bg-slate-950/55 backdrop-blur-[3px] lg:hidden"
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`fixed inset-y-0 left-0 z-1100 flex w-68 flex-col border-r border-slate-200/80 bg-white transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* BRAND */}

        <div className="flex h-19.5 items-center justify-between border-b border-slate-100 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm">
              <Navigation size={18} strokeWidth={2.5} />
            </div>

            <div>
              <p className="text-[17px] font-black tracking-tight">Gontobbo</p>

              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Driver Portal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* NAVIGATION */}

        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <p className="px-3 text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">
            Workspace
          </p>

          <div className="mt-3 space-y-1">
            <SidebarItem
              icon={Navigation}
              label="Dashboard"
              active={activeSection === "dashboard"}
              onClick={() => handleSidebarNavigation("dashboard")}
            />

            <SidebarItem
              icon={Car}
              label="Ride Requests"
              active={activeSection === "requests"}
              onClick={() => handleSidebarNavigation("requests")}
            />

            <SidebarItem
              icon={Clock3}
              label="Ride History"
              active={activeSection === "history"}
              onClick={() => handleSidebarNavigation("history")}
            />

            <SidebarItem
              icon={DollarSign}
              label="Earnings"
              active={activeSection === "earnings"}
              onClick={() => handleSidebarNavigation("earnings")}
            />

            <SidebarItem
              icon={Star}
              label="Ratings"
              active={activeSection === "ratings"}
              onClick={() => handleSidebarNavigation("ratings")}
            />
          </div>

          <p className="mt-9 px-3 text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">
            Account
          </p>

          <div className="mt-3 space-y-1">
            <SidebarItem
              icon={ShieldCheck}
              label="Driver Verification"
              active={activeSection === "verification"}
              onClick={() => handleSidebarNavigation("verification")}
            />

            <SidebarItem
              icon={User}
              label="Profile"
              active={activeSection === "profile"}
              onClick={() => handleSidebarNavigation("profile")}
            />
          </div>
        </nav>

        {/* USER */}

        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">
              {getInitials(user?.name)}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold">
                {user?.name || "Driver"}
              </p>

              <p className="truncate text-[10px] text-slate-400">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* MAIN */}

      <main className="lg:pl-68">
        {/* HEADER */}

        <header className="sticky top-0 z-1000 flex h-19.5 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
            >
              <Menu size={21} />
            </button>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">
                Driver Portal
              </p>

              <h1 className="mt-0.5 text-lg font-black tracking-tight">
                Dashboard
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className={`hidden items-center gap-2 rounded-full border px-3.5 py-2 text-[10px] font-black sm:flex ${
                online
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-500"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  online ? "animate-pulse bg-emerald-500" : "bg-slate-400"
                }`}
              />

              {online ? "ONLINE" : "OFFLINE"}
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin" : ""}
              />

              <span className="hidden sm:inline">Refresh</span>
            </button>

            <div className="hidden text-right sm:block">
              <p className="text-[10px] font-medium text-slate-400">
                Welcome back
              </p>

              <p className="text-xs font-black">{user?.name}</p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
              {getInitials(user?.name)}
            </div>
          </div>
        </header>

        {/* CONTENT */}

        <div
          id="dashboard"
          className="mx-auto max-w-345 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          {/* HERO */}

          <section className="mb-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      online ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                  />
                  Driver dashboard
                </div>

                <h2 className="text-3xl font-black tracking-[-0.03em] sm:text-[38px]">
                  Good to see you,{" "}
                  <span className="text-slate-500">
                    {user?.name?.split(" ")[0] || "Driver"}.
                  </span>
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Manage your availability, accept passenger requests, and keep
                  your rides moving.
                </p>
              </div>

              <div
                className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2.5 text-[11px] font-black ${
                  online
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    online ? "animate-pulse bg-emerald-500" : "bg-slate-400"
                  }`}
                />

                {online
                  ? "You're available for rides"
                  : "You're currently offline"}
              </div>
            </div>
          </section>

          {/* MESSAGE */}

          {statusMessage && (
            <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Dashboard update
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {statusMessage}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStatusMessage("")}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* AVAILABILITY */}

          <section
            className={`mb-7 overflow-hidden rounded-[28px] border bg-white shadow-sm ${
              online ? "border-emerald-200" : "border-slate-200"
            }`}
          >
            <div
              className={`h-1 ${online ? "bg-emerald-500" : "bg-slate-300"}`}
            />

            <div className="p-5 sm:p-7">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                      online
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {online ? <Wifi size={23} /> : <WifiOff size={23} />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">
                        Availability
                      </p>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[8px] font-black uppercase ${
                          online
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {online ? "Active" : "Paused"}
                      </span>
                    </div>

                    <h3 className="mt-1 text-xl font-black sm:text-2xl">
                      {online ? "You are online" : "You are offline"}
                    </h3>

                    <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                      {online
                        ? "Passengers can find you and new ride requests will appear automatically."
                        : "Go online whenever you're ready to receive passenger requests."}
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-slate-400">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          currentLocation ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      />

                      {locationStatus}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOnlineToggle}
                  disabled={statusUpdating}
                  className={`flex min-h-13 min-w-46.25 items-center justify-center gap-2.5 rounded-2xl px-6 py-3.5 text-sm font-black shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
                    online
                      ? "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                      : "bg-emerald-500 text-white hover:bg-emerald-400"
                  }`}
                >
                  {statusUpdating ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : online ? (
                    <WifiOff size={18} />
                  ) : (
                    <Wifi size={18} />
                  )}

                  {statusUpdating
                    ? "Updating..."
                    : online
                      ? "Go Offline"
                      : "Go Online"}
                </button>
              </div>

              <div className="mt-6 grid gap-2 sm:grid-cols-3">
                <AvailabilityItem
                  active={online}
                  label="Ride requests"
                  value={online ? "Receiving" : "Paused"}
                />

                <AvailabilityItem
                  active={online}
                  label="Passenger visibility"
                  value={online ? "Visible" : "Hidden"}
                />

                <AvailabilityItem
                  active={online && Boolean(currentLocation)}
                  label="GPS tracking"
                  value={
                    online ? (currentLocation ? "Active" : "Waiting") : "Paused"
                  }
                />
              </div>
            </div>
          </section>

          {/* STATS */}

          <section
            id="ratings"
            className="mb-7 scroll-mt-24 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            <StatCard
              icon={DollarSign}
              label="Today's earnings"
              value={`৳${todayEarnings.toFixed(0)}`}
              accent="emerald"
            />

            <StatCard
              icon={Car}
              label="Today's rides"
              value={todayRides.length}
              accent="blue"
            />

            <StatCard
              icon={Clock3}
              label="Completed rides"
              value={completedRides.length}
              accent="slate"
            />

            <StatCard
              icon={Star}
              label="Driver rating"
              value={
                averageRating !== null ? (
                  <span className="flex items-center gap-1.5">
                    {averageRating.toFixed(1)}
                    <Star
                      size={17}
                      fill="currentColor"
                      className="text-amber-400"
                    />
                  </span>
                ) : (
                  <span className="text-slate-400">No ratings yet</span>
                )
              }
              accent="amber"
            />
          </section>

          {/* ACTIVE RIDE */}

          {activeRide && (
            <section className="mb-7 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
              <div className="bg-slate-950 px-5 py-6 text-white sm:px-7">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

                      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">
                        Active ride
                      </p>
                    </div>

                    <h3 className="mt-2 text-2xl font-black">
                      {formatStatus(activeRide.status)}
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      Your current passenger assignment.
                    </p>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/6 px-5 py-4 sm:min-w-45 lg:block lg:text-right">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                      Current fare
                    </p>

                    <p className="text-2xl font-black">
                      ৳
                      {Number(
                        activeRide.finalFare ??
                          activeRide.estimatedFare ??
                          activeRide.fare ??
                          0,
                      ).toFixed(0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-7">
                <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                      {getInitials(
                        activeRide.passenger?.name ||
                          activeRide.user?.name ||
                          "Passenger",
                      )}
                    </div>

                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                        Passenger
                      </p>

                      <h4 className="mt-1 text-base font-black">
                        {activeRide.passenger?.name ||
                          activeRide.user?.name ||
                          "Passenger"}
                      </h4>
                    </div>
                  </div>

                  {(activeRide.passenger?.phone || activeRide.user?.phone) && (
                    <a
                      href={`tel:${
                        activeRide.passenger?.phone || activeRide.user?.phone
                      }`}
                      className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-400"
                    >
                      <Phone size={15} />
                      Call passenger
                    </a>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <LocationCard
                    label="Pickup"
                    value={
                      activeRide.pickup?.address ||
                      activeRide.pickup?.name ||
                      "Pickup location"
                    }
                    color="emerald"
                  />

                  <LocationCard
                    label="Destination"
                    value={
                      activeRide.destination?.address ||
                      activeRide.destination?.name ||
                      "Destination"
                    }
                    color="red"
                  />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <RideInfo
                    label="Vehicle"
                    value={formatVehicleType(activeRide.vehicleType)}
                  />

                  <RideInfo
                    label="Distance"
                    value={formatDistanceValue(activeRide.distanceKm)}
                  />

                  <RideInfo
                    label="Duration"
                    value={formatDurationValue(activeRide.durationMinutes)}
                  />

                  <RideInfo
                    label="Fare"
                    value={`৳${Number(
                      activeRide.finalFare ??
                        activeRide.estimatedFare ??
                        activeRide.fare ??
                        0,
                    ).toFixed(0)}`}
                  />
                </div>

                <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
                  <MapView
                    pickup={activeRide.pickup}
                    destination={activeRide.destination}
                    driverLocation={activeRide.driverLocation || null}
                    route={null}
                  />
                </div>

                <div className="mt-5">
                  {activeRide.status === "accepted" && (
                    <button
                      type="button"
                      onClick={handleDriverArriving}
                      disabled={
                        actionRideId === (activeRide._id || activeRide.id)
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-black text-white transition hover:bg-blue-500 disabled:opacity-50"
                    >
                      {actionRideId === (activeRide._id || activeRide.id) ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Navigation size={18} />
                      )}
                      I'm Arriving
                    </button>
                  )}

                  {activeRide.status === "driver_arriving" && (
                    <button
                      type="button"
                      onClick={handleStartRide}
                      disabled={
                        actionRideId === (activeRide._id || activeRide.id)
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 py-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
                    >
                      {actionRideId === (activeRide._id || activeRide.id) ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Navigation size={18} />
                      )}
                      Start Ride
                    </button>
                  )}

                  {activeRide.status === "in_progress" && (
                    <button
                      type="button"
                      onClick={handleCompleteRide}
                      disabled={
                        actionRideId === (activeRide._id || activeRide.id)
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-sm font-black text-white transition hover:bg-emerald-400 disabled:opacity-50"
                    >
                      {actionRideId === (activeRide._id || activeRide.id) ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={18} />
                      )}
                      Complete Ride
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* REQUESTS */}

          <section id="requests" className="mb-7 scroll-mt-24">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Incoming
                </p>

                <h3 className="mt-1 text-2xl font-black tracking-tight">
                  Ride requests
                </h3>
              </div>

              <div className="rounded-full bg-white px-3.5 py-2 text-[10px] font-black text-slate-500 shadow-sm ring-1 ring-slate-200">
                {availableRides.length} available
              </div>
            </div>

            {!online ? (
              <EmptyState
                icon={WifiOff}
                title="You're offline"
                description="Go online to start receiving passenger ride requests."
                action={
                  <button
                    type="button"
                    onClick={handleOnlineToggle}
                    disabled={statusUpdating}
                    className="mx-auto mt-5 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {statusUpdating ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <Wifi size={17} />
                    )}
                    Go Online
                  </button>
                }
              />
            ) : loading ? (
              <EmptyState
                icon={Loader2}
                title="Finding ride requests"
                description="Checking for new passenger requests..."
                spinning
              />
            ) : availableRides.length === 0 ? (
              <EmptyState
                icon={Car}
                title="No ride requests yet"
                description="Stay online. New passenger requests will appear here automatically."
              />
            ) : (
              <div className="grid gap-3">
                {availableRides.map((ride) => (
                  <RequestCard
                    key={ride._id || ride.id}
                    ride={ride}
                    actionRideId={actionRideId}
                    onAccept={handleAccept}
                    onReject={handleReject}
                  />
                ))}
              </div>
            )}
          </section>

          {/* EARNINGS + ACTIVITY */}

          <section
            id="earnings"
            className="mb-7 scroll-mt-24 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]"
          >
            {/* EARNINGS */}

            <div className="overflow-hidden rounded-[28px] bg-slate-950 p-6 text-white sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-500">
                    Earnings
                  </p>

                  <h3 className="mt-1 text-xl font-black">Your earnings</h3>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.07]">
                  <DollarSign size={18} className="text-slate-300" />
                </div>
              </div>

              <div className="mt-8">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Total earnings
                </p>

                <p className="mt-1 text-4xl font-black tracking-tight">
                  ৳{totalEarnings.toFixed(0)}
                </p>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-white/6 p-4">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                    Today
                  </p>

                  <p className="mt-2 text-xl font-black">
                    ৳{todayEarnings.toFixed(0)}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/6 p-4">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                    Trips
                  </p>

                  <p className="mt-2 text-xl font-black">
                    {completedRides.length}
                  </p>
                </div>
              </div>
            </div>

            {/* ACTIVITY */}

            <div
              id="history"
              className="scroll-mt-24 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
            >
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Activity
                  </p>

                  <h3 className="mt-1 text-xl font-black">
                    Recent completed rides
                  </h3>
                </div>

                <div className="hidden rounded-full bg-slate-50 px-3 py-1.5 text-[9px] font-black text-slate-400 sm:block">
                  Latest 6
                </div>
              </div>

              {completedRides.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                  <Clock3 size={22} className="mx-auto text-slate-400" />

                  <p className="mt-3 text-sm font-bold text-slate-500">
                    No completed rides yet.
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Your completed trips will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {completedRides.slice(0, 6).map((ride) => (
                    <CompletedRide key={ride._id || ride.id} ride={ride} />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ACCOUNT SECTIONS */}

          <section className="grid gap-5 md:grid-cols-2">
            {/* VERIFICATION */}

            <div
              id="verification"
              className="scroll-mt-24 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck size={19} />
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Driver Verification
                  </p>

                  <h3 className="mt-1 text-xl font-black">
                    Verification status
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Your driver account information and verification status.
                  </p>

                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-[10px] font-black text-emerald-700">
                    <CheckCircle2 size={13} />
                    Verified driver
                  </div>
                </div>
              </div>
            </div>

            {/* PROFILE */}

            <div
              id="profile"
              className="scroll-mt-24 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <User size={19} />
                </div>

                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Profile
                  </p>

                  <h3 className="mt-1 text-xl font-black">
                    {user?.name || "Driver"}
                  </h3>

                  <p className="mt-2 truncate text-sm text-slate-500">
                    {user?.email || "No email available"}
                  </p>

                  {user?.phone && (
                    <p className="mt-1 text-sm text-slate-500">{user.phone}</p>
                  )}

                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-[10px] font-black text-slate-600">
                    <User size={13} />
                    Driver account
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| REQUEST CARD
|--------------------------------------------------------------------------
*/

function RequestCard({ ride, actionRideId, onAccept, onReject }) {
  const rideId = ride._id || ride.id;
  const busy = actionRideId === rideId;

  return (
    <div className="group rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-px hover:border-slate-300 hover:shadow-md sm:p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <User size={18} />
              </div>

              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Passenger
                </p>

                <p className="truncate text-sm font-black">
                  {ride.passenger?.name || ride.user?.name || "Passenger"}
                </p>
              </div>
            </div>

            <div className="shrink-0 rounded-xl bg-emerald-50 px-3.5 py-2 text-right">
              <p className="text-[8px] font-black uppercase tracking-wider text-emerald-600">
                Fare
              </p>

              <p className="text-lg font-black text-emerald-700">
                ৳
                {Number(
                  ride.finalFare ?? ride.estimatedFare ?? ride.fare ?? 0,
                ).toFixed(0)}
              </p>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <LocationCard
              label="Pickup"
              value={ride.pickup?.address || ride.pickup?.name || "Pickup"}
              color="emerald"
            />

            <LocationCard
              label="Destination"
              value={
                ride.destination?.address ||
                ride.destination?.name ||
                "Destination"
              }
              color="red"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <InfoPill
              icon={<VehicleIcon type={ride.vehicleType} />}
              value={formatVehicleType(ride.vehicleType)}
            />

            <InfoPill
              icon={<Navigation size={13} />}
              value={formatDistanceValue(ride.distanceKm)}
            />

            <InfoPill
              icon={<Clock3 size={13} />}
              value={formatDurationValue(ride.durationMinutes)}
            />
          </div>
        </div>

        <div className="flex shrink-0 gap-2 lg:w-42.5 lg:flex-col">
          <button
            type="button"
            onClick={() => onAccept(ride)}
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 text-sm font-black text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 lg:flex-none"
          >
            {busy ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <CheckCircle2 size={17} />
            )}
            Accept
          </button>

          <button
            type="button"
            onClick={() => onReject(ride)}
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3.5 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 lg:flex-none"
          >
            <XCircle size={17} />
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| COMPLETED RIDE
|--------------------------------------------------------------------------
*/

function CompletedRide({ ride }) {
  return (
    <div className="group rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-slate-200 hover:bg-white">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />

            <p className="truncate text-sm font-black">
              {ride.destination?.address || "Completed ride"}
            </p>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2.5 text-[10px] font-medium text-slate-400">
            <span>
              {formatRideDate(
                ride.completedAt || ride.updatedAt || ride.createdAt,
              )}
            </span>

            <span className="h-1 w-1 rounded-full bg-slate-300" />

            <span>{formatVehicleType(ride.vehicleType)}</span>

            <span className="h-1 w-1 rounded-full bg-slate-300" />

            <span>{formatDistanceValue(ride.distanceKm)}</span>
          </div>
        </div>

        <p className="shrink-0 text-lg font-black">
          ৳
          {Number(
            ride.finalFare ?? ride.estimatedFare ?? ride.fare ?? 0,
          ).toFixed(0)}
        </p>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| EMPTY STATE
|--------------------------------------------------------------------------
*/

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  spinning = false,
}) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center sm:p-12">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <Icon
          size={23}
          className={`text-slate-400 ${spinning ? "animate-spin" : ""}`}
        />
      </div>

      <h4 className="mt-4 text-sm font-black">{title}</h4>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
        {description}
      </p>

      {action}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| LOCATION CARD
|--------------------------------------------------------------------------
*/

function LocationCard({ label, value, color }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${
            color === "emerald" ? "bg-emerald-500" : "bg-red-500"
          }`}
        />

        <p className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-400">
          {label}
        </p>
      </div>

      <p className="mt-2 line-clamp-2 text-sm font-bold leading-5 text-slate-800">
        {value}
      </p>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| RIDE INFO
|--------------------------------------------------------------------------
*/

function RideInfo({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3.5">
      <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| INFO PILL
|--------------------------------------------------------------------------
*/

function InfoPill({ icon, value }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black text-slate-600">
      {icon}
      {value}
    </span>
  );
}

/*
|--------------------------------------------------------------------------
| AVAILABILITY ITEM
|--------------------------------------------------------------------------
*/

function AvailabilityItem({ active, label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-2">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            active ? "bg-emerald-500" : "bg-slate-400"
          }`}
        />

        <span className="text-[11px] font-bold text-slate-500">{label}</span>
      </div>

      <span className="text-[11px] font-black text-slate-700">{value}</span>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| STAT CARD
|--------------------------------------------------------------------------
*/

function StatCard({ icon: Icon, label, value, accent = "slate" }) {
  const iconClasses = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    slate: "bg-slate-100 text-slate-500",
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-px hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-400">
            {label}
          </p>

          <p className="mt-3 text-2xl font-black tracking-tight">{value}</p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            iconClasses[accent]
          }`}
        >
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| SIDEBAR ITEM
|--------------------------------------------------------------------------
*/

function SidebarItem({ icon: Icon, label, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition ${
        active
          ? "bg-slate-950 text-white shadow-sm"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
      }`}
    >
      <Icon
        size={17}
        className={`transition ${
          active ? "text-white" : "text-slate-400 group-hover:text-slate-950"
        }`}
      />

      {label}
    </button>
  );
}

/*
|--------------------------------------------------------------------------
| VEHICLE ICON
|--------------------------------------------------------------------------
*/

function VehicleIcon({ type }) {
  if (type === "bike") {
    return <Bike size={14} />;
  }

  return <Car size={14} />;
}

/*
|--------------------------------------------------------------------------
| VEHICLE TYPE
|--------------------------------------------------------------------------
*/

function formatVehicleType(type) {
  if (type === "bike") {
    return "Bike";
  }

  if (type === "cng") {
    return "CNG";
  }

  return "Car";
}

/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
*/

function formatStatus(status) {
  if (!status) {
    return "Active ride";
  }

  return String(status)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/*
|--------------------------------------------------------------------------
| DISTANCE
|--------------------------------------------------------------------------
*/

function formatDistanceValue(value) {
  if (value === undefined || value === null || value === "") {
    return "—";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return `${number.toFixed(1)} km`;
}

/*
|--------------------------------------------------------------------------
| DURATION
|--------------------------------------------------------------------------
*/

function formatDurationValue(value) {
  if (value === undefined || value === null || value === "") {
    return "—";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return `${Math.round(number)} min`;
}

/*
|--------------------------------------------------------------------------
| DATE
|--------------------------------------------------------------------------
*/

function formatRideDate(date) {
  if (!date) {
    return "Unknown date";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Unknown date";
  }

  return parsed.toLocaleString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/*
|--------------------------------------------------------------------------
| INITIALS
|--------------------------------------------------------------------------
*/

function getInitials(name = "") {
  return (
    String(name)
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "D"
  );
}
