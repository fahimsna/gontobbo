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
  startRide,
  completeRide,
  getAvailableRides,
  getDriverRides,
  setDriverOnline,
  setDriverOffline,
} from "../../services/rideService";

const POLL_INTERVAL = 4000;

export default function DriverDashboard() {
  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | DRIVER ONLINE STATUS
  |--------------------------------------------------------------------------
  */

  const [online, setOnline] = useState(user?.online ?? user?.isOnline ?? false);

  const [statusUpdating, setStatusUpdating] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | RIDES
  |--------------------------------------------------------------------------
  */

  const [availableRides, setAvailableRides] = useState([]);

  const [driverRides, setDriverRides] = useState([]);

  const [activeRide, setActiveRide] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [actionRideId, setActionRideId] = useState(null);

  const [statusMessage, setStatusMessage] = useState("");

  /*
  |--------------------------------------------------------------------------
  | LOAD DRIVER DATA
  |--------------------------------------------------------------------------
  */

  const loadDriverData = useCallback(
    async (silent = false) => {
      /*
       * Don't request available rides while offline.
       */
      if (!online) {
        setAvailableRides([]);

        if (!silent) {
          setLoading(false);
        }

        /*
         * Still load driver history.
         */
        try {
          const historyResponse = await getDriverRides();

          const history =
            historyResponse?.rides || historyResponse?.data?.rides || [];

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

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD + POLLING
  |--------------------------------------------------------------------------
  */

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
  | GO ONLINE / GO OFFLINE
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
        /*
         * GO OFFLINE
         */

        await setDriverOffline();

        setOnline(false);

        setAvailableRides([]);

        setStatusMessage("You are now offline.");
      } else {
        /*
         * GO ONLINE
         */

        await setDriverOnline();

        setOnline(true);

        setStatusMessage("You are now online and ready for rides.");
      }
    } catch (error) {
      console.error("Driver online/offline error:", error);

      setStatusMessage(
        error?.response?.data?.message || "Unable to update your availability.",
      );
    } finally {
      setStatusUpdating(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | ACCEPT RIDE
  |--------------------------------------------------------------------------
  */

  const handleAccept = async (ride) => {
    const rideId = ride._id || ride.id;

    try {
      setActionRideId(rideId);

      setStatusMessage("");

      const response = await acceptRide(rideId);

      const acceptedRide = response?.ride || response?.data?.ride || ride;

      setActiveRide(acceptedRide);

      setAvailableRides((current) =>
        current.filter((item) => (item._id || item.id) !== rideId),
      );

      setStatusMessage("Ride accepted successfully.");

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
  | REJECT RIDE
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
  | START RIDE
  |--------------------------------------------------------------------------
  */

  const handleStartRide = async () => {
    if (!activeRide) {
      return;
    }

    const rideId = activeRide._id || activeRide.id;

    try {
      setActionRideId(rideId);

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
  | COMPLETE RIDE
  |--------------------------------------------------------------------------
  */

  const handleCompleteRide = async () => {
    if (!activeRide) {
      return;
    }

    const rideId = activeRide._id || activeRide.id;

    try {
      setActionRideId(rideId);

      const response = await completeRide(rideId);

      setActiveRide(null);

      setStatusMessage("Ride completed successfully.");

      await loadDriverData(true);

      if (response?.ride || response?.data?.ride) {
        const completed = response.ride || response.data.ride;

        setDriverRides((current) => [
          completed,
          ...current.filter((ride) => (ride._id || ride.id) !== rideId),
        ]);
      }
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
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      {/* MOBILE OVERLAY */}

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-[1050] bg-slate-950/40 lg:hidden"
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`fixed inset-y-0 left-0 z-[1100] flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
              <Navigation size={20} />
            </div>

            <div>
              <p className="font-bold">Gontobbo</p>

              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Driver
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Driver menu
          </p>

          <div className="mt-3 space-y-1">
            <SidebarItem icon={Navigation} label="Dashboard" active />

            <SidebarItem icon={Car} label="Ride Requests" />

            <SidebarItem icon={Clock3} label="Ride History" />

            <SidebarItem icon={DollarSign} label="Earnings" />

            <SidebarItem icon={Star} label="Ratings" />
          </div>

          <p className="mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Account
          </p>

          <div className="mt-3 space-y-1">
            <SidebarItem icon={ShieldCheck} label="Driver Verification" />

            <SidebarItem icon={User} label="Profile" />
          </div>
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
              {getInitials(user?.name)}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold">
                {user?.name || "Driver"}
              </p>

              <p className="truncate text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* MAIN */}

      <main className="relative z-0 lg:pl-72">
        {/* HEADER */}

        <header className="sticky top-0 z-[1000] flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl p-2 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={22} />
            </button>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Driver portal
              </p>

              <h1 className="text-lg font-bold">Driver Dashboard</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* SMALL HEADER STATUS */}

            <div
              className={`hidden items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold sm:flex ${
                online
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {online ? <Wifi size={15} /> : <WifiOff size={15} />}

              {online ? "Online" : "Offline"}

              <span
                className={`h-2 w-2 rounded-full ${
                  online ? "animate-pulse bg-emerald-500" : "bg-slate-400"
                }`}
              />
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin" : ""}
              />

              <span className="hidden sm:inline">Refresh</span>
            </button>

            <div className="hidden text-right sm:block">
              <p className="text-xs text-slate-400">Welcome</p>

              <p className="text-sm font-bold">{user?.name}</p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
              {getInitials(user?.name)}
            </div>
          </div>
        </header>

        <div className="relative z-0 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* WELCOME */}

          <section className="mb-7">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Ready for the road?
                </p>

                <h2 className="mt-1 text-3xl font-bold tracking-tight">
                  Good to see you, {user?.name?.split(" ")[0] || "Driver"}.
                </h2>
              </div>

              <div
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${
                  online
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    online ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                />

                {online ? "You're available for rides" : "You're offline"}
              </div>
            </div>
          </section>

          {/* STATUS MESSAGE */}

          {statusMessage && (
            <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 shadow-sm">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-emerald-500" />

                {statusMessage}
              </div>

              <button
                type="button"
                onClick={() => setStatusMessage("")}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* ============================================================
              DRIVER AVAILABILITY
              ============================================================ */}

          <section
            className={`relative z-0 mb-7 overflow-hidden rounded-3xl border shadow-sm ${
              online
                ? "border-emerald-200 bg-white"
                : "border-slate-200 bg-white"
            }`}
          >
            <div
              className={`h-2 w-full ${
                online ? "bg-emerald-500" : "bg-slate-300"
              }`}
            />

            <div className="p-6 sm:p-8">
              <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
                {/* STATUS */}

                <div className="flex items-center gap-5">
                  <div
                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${
                      online
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {online ? <Wifi size={28} /> : <WifiOff size={28} />}
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                      Driver availability
                    </p>

                    <div className="mt-1 flex items-center gap-2">
                      <h3 className="text-2xl font-bold">
                        {online ? "You are Online" : "You are Offline"}
                      </h3>

                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          online
                            ? "animate-pulse bg-emerald-500"
                            : "bg-slate-400"
                        }`}
                      />
                    </div>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                      {online
                        ? "Passengers can find you and new ride requests will appear automatically."
                        : "You are currently unavailable. Go online to start receiving passenger requests."}
                    </p>
                  </div>
                </div>

                {/* BIG BUTTON */}

                <button
                  type="button"
                  onClick={handleOnlineToggle}
                  disabled={statusUpdating}
                  className={`flex min-h-14 min-w-[190px] items-center justify-center gap-3 rounded-2xl px-7 py-4 text-sm font-bold shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
                    online
                      ? "bg-red-50 text-red-600 ring-1 ring-red-200 hover:bg-red-100"
                      : "bg-emerald-500 text-white hover:bg-emerald-400"
                  }`}
                >
                  {statusUpdating ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : online ? (
                    <WifiOff size={20} />
                  ) : (
                    <Wifi size={20} />
                  )}

                  {statusUpdating
                    ? "Updating..."
                    : online
                      ? "Go Offline"
                      : "Go Online"}
                </button>
              </div>

              {/* AVAILABILITY DETAILS */}

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
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
                  active={online}
                  label="Auto refresh"
                  value={online ? "Active" : "Paused"}
                />
              </div>
            </div>
          </section>

          {/* STATS */}

          <section className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={DollarSign}
              label="Today's earnings"
              value={`৳${todayEarnings.toFixed(0)}`}
            />

            <StatCard
              icon={Car}
              label="Today's rides"
              value={todayRides.length}
            />

            <StatCard
              icon={Clock3}
              label="Completed rides"
              value={completedRides.length}
            />

            <StatCard
              icon={Star}
              label="Driver rating"
              value={user?.rating || "—"}
            />
          </section>

          {/* ACTIVE RIDE */}

          {activeRide && (
            <section className="relative z-0 mb-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-950 px-6 py-6 text-white sm:px-8">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />

                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        Active ride
                      </p>
                    </div>

                    <h3 className="mt-2 text-2xl font-bold">
                      {formatStatus(activeRide.status)}
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      Passenger ride currently assigned to you.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/10 px-5 py-3 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Fare
                    </p>

                    <p className="mt-1 text-2xl font-bold">
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

              <div className="p-6 sm:p-8">
                {/* PASSENGER */}

                <div className="mb-6 rounded-3xl bg-slate-50 p-5">
                  <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
                        {getInitials(
                          activeRide.passenger?.name ||
                            activeRide.user?.name ||
                            "Passenger",
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Passenger
                        </p>

                        <h4 className="mt-1 text-lg font-bold">
                          {activeRide.passenger?.name ||
                            activeRide.user?.name ||
                            "Passenger"}
                        </h4>
                      </div>
                    </div>

                    {(activeRide.passenger?.phone ||
                      activeRide.user?.phone) && (
                      <a
                        href={`tel:${
                          activeRide.passenger?.phone || activeRide.user?.phone
                        }`}
                        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-400"
                      >
                        <Phone size={17} />
                        Call passenger
                      </a>
                    )}
                  </div>
                </div>

                {/* LOCATIONS */}

                <div className="grid gap-4 md:grid-cols-2">
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

                {/* DETAILS */}

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
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

                {/* MAP */}

                <div className="relative z-0 mt-6 overflow-hidden rounded-3xl border border-slate-200">
                  <MapView
                    pickup={activeRide.pickup}
                    destination={activeRide.destination}
                    driverLocation={activeRide.driverLocation || null}
                    route={null}
                  />
                </div>

                {/* ACTION */}

                <div className="mt-6">
                  {["accepted", "driver_arriving"].includes(
                    activeRide.status,
                  ) && (
                    <button
                      type="button"
                      onClick={handleStartRide}
                      disabled={
                        actionRideId === (activeRide._id || activeRide.id)
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 py-4 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
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
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-sm font-bold text-white hover:bg-emerald-400 disabled:opacity-50"
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

          {/* RIDE REQUESTS */}

          <section className="relative z-0 mb-7">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  Incoming
                </p>

                <h3 className="mt-1 text-2xl font-bold">Ride requests</h3>
              </div>

              <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
                {availableRides.length} available
              </div>
            </div>

            {!online ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <WifiOff size={23} className="text-slate-400" />
                </div>

                <h4 className="mt-4 font-bold">You are offline</h4>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                  Go online to receive passenger ride requests.
                </p>

                <button
                  type="button"
                  onClick={handleOnlineToggle}
                  disabled={statusUpdating}
                  className="mx-auto mt-5 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-400 disabled:opacity-50"
                >
                  {statusUpdating ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Wifi size={17} />
                  )}
                  Go Online
                </button>
              </div>
            ) : loading ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
                <Loader2
                  size={25}
                  className="mx-auto animate-spin text-slate-400"
                />

                <p className="mt-3 text-sm text-slate-400">
                  Loading ride requests...
                </p>
              </div>
            ) : availableRides.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <Car size={23} className="text-slate-400" />
                </div>

                <h4 className="mt-4 font-bold">No ride requests</h4>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                  New passenger requests will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
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

          {/* EARNINGS */}

          <section className="mb-7 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Earnings
              </p>

              <h3 className="mt-2 text-2xl font-bold">Your earnings</h3>

              <div className="mt-8">
                <p className="text-sm text-slate-500">Total earnings</p>

                <p className="mt-2 text-4xl font-bold">
                  ৳{totalEarnings.toFixed(0)}
                </p>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Today
                  </p>

                  <p className="mt-2 text-xl font-bold">
                    ৳{todayEarnings.toFixed(0)}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Trips
                  </p>

                  <p className="mt-2 text-xl font-bold">
                    {completedRides.length}
                  </p>
                </div>
              </div>
            </div>

            {/* RECENT */}

            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  Activity
                </p>

                <h3 className="mt-1 text-xl font-bold">
                  Recent completed rides
                </h3>
              </div>

              {completedRides.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-8 text-center">
                  <Clock3 size={22} className="mx-auto text-slate-400" />

                  <p className="mt-3 text-sm font-semibold text-slate-500">
                    No completed rides yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {completedRides.slice(0, 6).map((ride) => (
                    <CompletedRide key={ride._id || ride.id} ride={ride} />
                  ))}
                </div>
              )}
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
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                <User size={19} className="text-slate-500" />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Passenger
                </p>

                <p className="text-sm font-bold">
                  {ride.passenger?.name || ride.user?.name || "Passenger"}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-emerald-50 px-3 py-2 text-right">
              <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">
                Fare
              </p>

              <p className="text-lg font-bold text-emerald-700">
                ৳
                {Number(
                  ride.finalFare ?? ride.estimatedFare ?? ride.fare ?? 0,
                ).toFixed(0)}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
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
              icon={<Navigation size={14} />}
              value={formatDistanceValue(ride.distanceKm)}
            />

            <InfoPill
              icon={<Clock3 size={14} />}
              value={formatDurationValue(ride.durationMinutes)}
            />
          </div>
        </div>

        <div className="flex shrink-0 gap-3 lg:w-56 lg:flex-col">
          <button
            type="button"
            onClick={() => onAccept(ride)}
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3.5 text-sm font-bold text-white hover:bg-emerald-400 disabled:opacity-50 lg:flex-none"
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
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-5 py-3.5 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 lg:flex-none"
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
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />

            <p className="truncate text-sm font-bold">
              {ride.destination?.address || "Completed ride"}
            </p>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span>
              {formatRideDate(
                ride.completedAt || ride.updatedAt || ride.createdAt,
              )}
            </span>

            <span>{formatVehicleType(ride.vehicleType)}</span>

            <span>{formatDistanceValue(ride.distanceKm)}</span>
          </div>
        </div>

        <p className="shrink-0 text-lg font-bold">
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
| LOCATION CARD
|--------------------------------------------------------------------------
*/

function LocationCard({ label, value, color }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            color === "emerald" ? "bg-emerald-500" : "bg-red-500"
          }`}
        />

        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
      </div>

      <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">
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
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
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
    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
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
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            active ? "bg-emerald-500" : "bg-slate-400"
          }`}
        />

        <span className="text-xs font-semibold text-slate-500">{label}</span>
      </div>

      <span className="text-xs font-bold text-slate-700">{value}</span>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| STAT CARD
|--------------------------------------------------------------------------
*/

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>

          <p className="mt-3 text-2xl font-bold">{value}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
          <Icon size={19} className="text-slate-500" />
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

function SidebarItem({ icon: Icon, label, active = false }) {
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${
        active
          ? "bg-slate-950 text-white"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
      }`}
    >
      <Icon size={18} />

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
