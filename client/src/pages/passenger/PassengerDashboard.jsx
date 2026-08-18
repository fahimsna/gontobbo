import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Car,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  Menu,
  Navigation,
  Phone,
  RefreshCw,
  ShieldCheck,
  Star,
  User,
  Wifi,
  X,
  XCircle,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

import MapView from "../../components/ui/MapView";

import {
  calculateFare,
  calculateRoute,
  formatDistance,
  formatDuration,
  searchLocation,
  buildRideLocation,
} from "../../services/mapService";

import {
  createRide,
  getActiveRide,
  getMyRides,
  cancelRide,
} from "../../services/rideService";

/*
|--------------------------------------------------------------------------
| CONFIG
|--------------------------------------------------------------------------
*/

const RIDE_POLL_INTERVAL = 4000;

/*
|--------------------------------------------------------------------------
| PASSENGER DASHBOARD
|--------------------------------------------------------------------------
*/

export default function PassengerDashboard() {
  const { user, logout } = useAuth();

  /*
  |--------------------------------------------------------------------------
  | SIDEBAR
  |--------------------------------------------------------------------------
  */

  const [sidebarOpen, setSidebarOpen] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | LOCATION
  |--------------------------------------------------------------------------
  */

  const [pickupText, setPickupText] = useState("");

  const [destinationText, setDestinationText] = useState("");

  const [pickup, setPickup] = useState(null);

  const [destination, setDestination] = useState(null);

  const [pickupResults, setPickupResults] = useState([]);

  const [destinationResults, setDestinationResults] = useState([]);

  const [pickupSearching, setPickupSearching] = useState(false);

  const [destinationSearching, setDestinationSearching] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | ROUTE
  |--------------------------------------------------------------------------
  */

  const [route, setRoute] = useState(null);

  const [routeLoading, setRouteLoading] = useState(false);

  const [routeError, setRouteError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | RIDES
  |--------------------------------------------------------------------------
  */

  const [activeRide, setActiveRide] = useState(null);

  const [rideHistory, setRideHistory] = useState([]);

  const [activeRideLoading, setActiveRideLoading] = useState(true);

  const [historyLoading, setHistoryLoading] = useState(true);

  const [rideLoading, setRideLoading] = useState(false);

  const [cancelLoading, setCancelLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | COMPONENT MOUNT
  |--------------------------------------------------------------------------
  */

  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    return () => {
      setMounted(false);
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | SEARCH PICKUP
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (pickup) {
      setPickupResults([]);
      return;
    }

    const query = pickupText.trim();

    if (query.length < 2) {
      setPickupResults([]);
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      try {
        setPickupSearching(true);

        const results = await searchLocation(query);

        if (!cancelled) {
          setPickupResults(results);
        }
      } catch (error) {
        console.error("Pickup search error:", error);

        if (!cancelled) {
          setPickupResults([]);
        }
      } finally {
        if (!cancelled) {
          setPickupSearching(false);
        }
      }
    }, 500);

    return () => {
      cancelled = true;

      window.clearTimeout(timer);
    };
  }, [pickupText, pickup]);

  /*
  |--------------------------------------------------------------------------
  | SEARCH DESTINATION
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (destination) {
      setDestinationResults([]);

      return;
    }

    const query = destinationText.trim();

    if (query.length < 2) {
      setDestinationResults([]);

      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      try {
        setDestinationSearching(true);

        const results = await searchLocation(query);

        if (!cancelled) {
          setDestinationResults(results);
        }
      } catch (error) {
        console.error("Destination search error:", error);

        if (!cancelled) {
          setDestinationResults([]);
        }
      } finally {
        if (!cancelled) {
          setDestinationSearching(false);
        }
      }
    }, 500);

    return () => {
      cancelled = true;

      window.clearTimeout(timer);
    };
  }, [destinationText, destination]);

  /*
  |--------------------------------------------------------------------------
  | CALCULATE ROUTE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!pickup || !destination) {
      setRoute(null);
      setRouteError("");

      return;
    }

    let cancelled = false;

    const calculate = async () => {
      try {
        setRouteLoading(true);

        setRouteError("");

        const result = await calculateRoute(pickup, destination);

        if (cancelled) {
          return;
        }

        if (
          !Number.isFinite(result.distanceKm) ||
          result.distanceKm <= 0 ||
          result.distanceKm > 200
        ) {
          throw new Error("Invalid route distance.");
        }

        if (
          !Number.isFinite(result.durationMinutes) ||
          result.durationMinutes <= 0 ||
          result.durationMinutes > 600
        ) {
          throw new Error("Invalid route duration.");
        }

        setRoute(result);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Route calculation error:", error);

        setRoute(null);

        setRouteError(
          "Unable to calculate a valid route. Please select the locations again.",
        );
      } finally {
        if (!cancelled) {
          setRouteLoading(false);
        }
      }
    };

    calculate();

    return () => {
      cancelled = true;
    };
  }, [pickup, destination]);

  /*
  |--------------------------------------------------------------------------
  | LOAD ACTIVE RIDE
  |--------------------------------------------------------------------------
  */

  const loadActiveRide = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setActiveRideLoading(true);
      }

      const response = await getActiveRide();

      const ride = response?.ride || null;

      /*
       * Ignore corrupted development rides.
       */

      if (ride && Number(ride.distanceKm) > 200) {
        setActiveRide(null);

        return;
      }

      setActiveRide(ride);
    } catch (error) {
      console.error("Active ride error:", error);

      /*
       * Do not destroy a visible active ride because
       * one polling request failed.
       */

      if (!silent) {
        setActiveRide(null);
      }
    } finally {
      if (!silent) {
        setActiveRideLoading(false);
      }
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | LOAD HISTORY
  |--------------------------------------------------------------------------
  */

  const loadRideHistory = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setHistoryLoading(true);
      }

      const response = await getMyRides();

      const rides = Array.isArray(response?.rides) ? response.rides : [];

      const validRides = rides.filter((ride) => {
        const distance = Number(ride.distanceKm);

        return !Number.isFinite(distance) || distance <= 200;
      });

      setRideHistory(validRides);
    } catch (error) {
      console.error("Ride history error:", error);

      /*
       * Do not erase existing history during
       * background polling.
       */

      if (!silent) {
        setRideHistory([]);
      }
    } finally {
      if (!silent) {
        setHistoryLoading(false);
      }
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | INITIAL RIDE LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadActiveRide();
    loadRideHistory();

    const interval = window.setInterval(() => {
      /*
       * This is what makes the passenger see
       * the driver acceptance automatically.
       */

      loadActiveRide(true);

      loadRideHistory(true);
    }, RIDE_POLL_INTERVAL);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadActiveRide, loadRideHistory]);

  /*
  |--------------------------------------------------------------------------
  | SELECT PICKUP
  |--------------------------------------------------------------------------
  */

  const selectPickup = (location) => {
    setPickup(location);

    setPickupText(location.name || location.displayName || "");

    setPickupResults([]);

    setRoute(null);

    setRouteError("");
  };

  /*
  |--------------------------------------------------------------------------
  | SELECT DESTINATION
  |--------------------------------------------------------------------------
  */

  const selectDestination = (location) => {
    setDestination(location);

    setDestinationText(location.name || location.displayName || "");

    setDestinationResults([]);

    setRoute(null);

    setRouteError("");
  };

  /*
  |--------------------------------------------------------------------------
  | CLEAR PICKUP
  |--------------------------------------------------------------------------
  */

  const clearPickup = () => {
    setPickup(null);

    setPickupText("");

    setRoute(null);

    setRouteError("");
  };

  /*
  |--------------------------------------------------------------------------
  | CLEAR DESTINATION
  |--------------------------------------------------------------------------
  */

  const clearDestination = () => {
    setDestination(null);

    setDestinationText("");

    setRoute(null);

    setRouteError("");
  };

  /*
  |--------------------------------------------------------------------------
  | FARE
  |--------------------------------------------------------------------------
  */

  const fare = useMemo(() => {
    if (!route) {
      return 0;
    }

    return calculateFare(route.distanceKm);
  }, [route]);

  /*
  |--------------------------------------------------------------------------
  | REQUEST RIDE
  |--------------------------------------------------------------------------
  */

  const handleRequestRide = async () => {
    if (!pickup || !destination || !route) {
      window.alert("Please select both pickup and destination.");

      return;
    }

    if (route.distanceKm <= 0 || route.distanceKm > 200) {
      window.alert(
        "Invalid route distance. Please select the locations again.",
      );

      return;
    }

    try {
      setRideLoading(true);

      const pickupLocation = buildRideLocation(pickup);

      const destinationLocation = buildRideLocation(destination);

      const payload = {
        pickup: pickupLocation,

        destination: destinationLocation,

        distanceKm: Number(route.distanceKm.toFixed(2)),

        durationMinutes: Number(route.durationMinutes.toFixed(1)),

        estimatedFare: fare,

        /*
         * Driver currently uses car.
         *
         * We can add a vehicle selector next.
         */

        vehicleType: "car",
      };

      console.log("Creating ride:", payload);

      const response = await createRide(payload);

      const createdRide = response?.ride || null;

      if (createdRide && Number(createdRide.distanceKm) > 200) {
        throw new Error("Backend returned an invalid route distance.");
      }

      setActiveRide(createdRide);

      /*
       * Clear booking form.
       */

      setPickup(null);
      setDestination(null);

      setPickupText("");

      setDestinationText("");

      setRoute(null);

      setRouteError("");

      await loadRideHistory();

      /*
       * Do not use an alert here.
       *
       * The active ride card itself now tells the passenger
       * the ride was requested.
       */

      console.log("Ride requested successfully.");
    } catch (error) {
      console.error("Request ride error:", error);

      window.alert(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to request ride.",
      );
    } finally {
      setRideLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CANCEL RIDE
  |--------------------------------------------------------------------------
  */

  const handleCancelRide = async () => {
    if (!activeRide?._id) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this ride?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancelLoading(true);

      const response = await cancelRide(
        activeRide._id,
        "Cancelled by passenger",
      );

      setActiveRide(response?.ride || null);

      await loadRideHistory();
    } catch (error) {
      console.error("Cancel ride error:", error);

      window.alert(error?.response?.data?.message || "Failed to cancel ride.");
    } finally {
      setCancelLoading(false);
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

      await Promise.all([loadActiveRide(), loadRideHistory()]);
    } finally {
      setRefreshing(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | STATS
  |--------------------------------------------------------------------------
  */

  const completedRides = rideHistory.filter(
    (ride) => ride.status === "completed",
  ).length;

  const currentDate = new Date();

  const monthlyRides = rideHistory.filter((ride) => {
    const date = new Date(ride.createdAt || ride.requestedAt);

    return (
      date.getMonth() === currentDate.getMonth() &&
      date.getFullYear() === currentDate.getFullYear()
    );
  }).length;

  /*
  |--------------------------------------------------------------------------
  | DRIVER ACCEPTED
  |--------------------------------------------------------------------------
  */

  const driverAccepted = Boolean(
    activeRide?.driver &&
    ["accepted", "driver_arriving", "in_progress"].includes(activeRide.status),
  );

  /*
  |--------------------------------------------------------------------------
  | MAIN RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      {/* MOBILE OVERLAY */}

      {sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-label="Close sidebar"
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
              <Navigation size={20} />
            </div>

            <div>
              <p className="font-bold">Gontobbo</p>

              <p className="text-[11px] text-slate-400">Passenger</p>
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

        <nav className="flex-1 px-4 py-6">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Menu
          </p>

          <div className="mt-3 space-y-1">
            <SidebarItem icon={Navigation} label="Dashboard" active />

            <SidebarItem icon={Car} label="My Rides" />

            <SidebarItem icon={MapPin} label="Saved Places" />
          </div>

          <p className="mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Account
          </p>

          <div className="mt-3">
            <SidebarItem icon={ShieldCheck} label="Profile" />
          </div>
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
              {getInitials(user?.name)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">
                {user?.name || "Passenger"}
              </p>

              <p className="truncate text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="mt-3 w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* MAIN */}

      <main className="lg:pl-72">
        {/* HEADER */}

        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl p-2 hover:bg-slate-100 lg:hidden"
          >
            <Menu size={22} />
          </button>

          <div className="hidden lg:block">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Passenger portal
            </p>

            <h1 className="text-lg font-bold">Dashboard</h1>
          </div>

          <div className="flex items-center gap-3">
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
              <p className="text-xs text-slate-400">Welcome back</p>

              <p className="text-sm font-bold">{user?.name}</p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
              {getInitials(user?.name)}
            </div>
          </div>
        </header>

        {/* CONTENT */}

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* WELCOME */}

          <section className="mb-8">
            <p className="text-sm font-medium text-slate-400">
              Good to see you,
            </p>

            <h2 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
              Where are you going,
              <span className="text-slate-400">
                {" "}
                {user?.name?.split(" ")[0] || "today"}?
              </span>
            </h2>
          </section>

          {/* ==================================================
              ACTIVE RIDE
          ================================================== */}

          {!activeRideLoading && activeRide && (
            <section className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              {/* STATUS HEADER */}

              <div
                className={`border-b px-6 py-6 sm:px-8 ${
                  driverAccepted
                    ? "border-emerald-100 bg-emerald-50/70"
                    : "border-slate-100 bg-slate-50"
                }`}
              >
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          driverAccepted
                            ? "animate-pulse bg-emerald-500"
                            : "animate-pulse bg-amber-500"
                        }`}
                      />

                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                        Current ride
                      </p>
                    </div>

                    <h3 className="mt-2 text-2xl font-bold">
                      {getRideStatusLabel(activeRide.status)}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {getRideStatusDescription(activeRide.status)}
                    </p>
                  </div>

                  {["requested", "searching"].includes(activeRide.status) && (
                    <button
                      type="button"
                      onClick={handleCancelRide}
                      disabled={cancelLoading}
                      className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {cancelLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <X size={16} />
                      )}
                      Cancel Ride
                    </button>
                  )}
                </div>
              </div>

              {/* DRIVER CARD */}

              {driverAccepted && (
                <div className="border-b border-slate-100 p-6 sm:p-8">
                  <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-lg font-bold text-white">
                          {getInitials(activeRide.driver?.name)}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-bold">
                              {activeRide.driver?.name || "Your driver"}
                            </h4>

                            <CheckCircle2
                              size={17}
                              className="text-emerald-500"
                            />
                          </div>

                          <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                            <Star
                              size={14}
                              className="fill-amber-400 text-amber-400"
                            />

                            <span>Driver assigned</span>
                          </div>
                        </div>
                      </div>

                      {activeRide.driver?.phone && (
                        <a
                          href={`tel:${activeRide.driver.phone}`}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-400"
                        >
                          <Phone size={17} />
                          Call driver
                        </a>
                      )}
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <DriverInfo
                        icon={<Car size={16} />}
                        label="Vehicle"
                        value="Car"
                      />

                      <DriverInfo
                        icon={<Navigation size={16} />}
                        label="Status"
                        value={getDriverStatus(activeRide.status)}
                      />

                      <DriverInfo
                        icon={<Wifi size={16} />}
                        label="Connection"
                        value="Connected"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SEARCHING CARD */}

              {!driverAccepted &&
                ["requested", "searching"].includes(activeRide.status) && (
                  <div className="border-b border-slate-100 p-6 sm:p-8">
                    <div className="rounded-3xl border border-amber-100 bg-amber-50 p-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
                          <Loader2
                            size={25}
                            className="animate-spin text-amber-600"
                          />
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-900">
                            Finding your driver
                          </h4>

                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            Nearby approved drivers are being checked for your
                            ride.
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 h-2 overflow-hidden rounded-full bg-amber-100">
                        <div className="h-full w-1/2 animate-pulse rounded-full bg-amber-400" />
                      </div>
                    </div>
                  </div>
                )}

              {/* LOCATIONS */}

              <div className="p-6 sm:p-8">
                <div className="grid gap-4 md:grid-cols-2">
                  <LocationCard
                    label="Pickup"
                    value={activeRide.pickup?.address || "Pickup location"}
                    color="emerald"
                  />

                  <LocationCard
                    label="Destination"
                    value={activeRide.destination?.address || "Destination"}
                    color="red"
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <RideInfo
                    label="Distance"
                    value={safeDistance(activeRide.distanceKm)}
                  />

                  <RideInfo
                    label="Duration"
                    value={safeDuration(activeRide.durationMinutes)}
                  />

                  <RideInfo
                    label="Fare"
                    value={`৳${Number(activeRide.estimatedFare || 0).toFixed(
                      0,
                    )}`}
                  />

                  <RideInfo
                    label="Vehicle"
                    value={activeRide.vehicleType || "car"}
                  />
                </div>
              </div>
            </section>
          )}

          {/* ==================================================
              BOOKING
          ================================================== */}

          {!activeRide && (
            <section className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">
              <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
                {/* FORM */}

                <div className="p-6 sm:p-8 lg:p-10">
                  <div className="mb-8">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                      Book a ride
                    </p>

                    <h3 className="mt-2 text-2xl font-bold">
                      Get where you need to go.
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Search for your pickup and destination.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* PICKUP */}

                    <div className="relative">
                      <div className="absolute left-4 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-500/10">
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      </div>

                      <input
                        value={pickupText}
                        onChange={(event) => {
                          setPickup(null);

                          setPickupText(event.target.value);
                        }}
                        placeholder="Pickup location"
                        className="w-full rounded-2xl border border-slate-700 bg-slate-900 py-4 pl-14 pr-12 text-sm text-white outline-none placeholder:text-slate-500 focus:border-slate-400"
                      />

                      {pickupText && (
                        <button
                          type="button"
                          onClick={clearPickup}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:text-white"
                        >
                          <X size={16} />
                        </button>
                      )}

                      {pickupSearching && <SearchLoading />}

                      {pickupResults.length > 0 && (
                        <LocationResults
                          results={pickupResults}
                          onSelect={selectPickup}
                        />
                      )}
                    </div>

                    {/* DESTINATION */}

                    <div className="relative">
                      <div className="absolute left-4 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-red-500/10">
                        <MapPin size={15} className="text-red-400" />
                      </div>

                      <input
                        value={destinationText}
                        onChange={(event) => {
                          setDestination(null);

                          setDestinationText(event.target.value);
                        }}
                        placeholder="Where to?"
                        className="w-full rounded-2xl border border-slate-700 bg-slate-900 py-4 pl-14 pr-12 text-sm text-white outline-none placeholder:text-slate-500 focus:border-slate-400"
                      />

                      {destinationText && (
                        <button
                          type="button"
                          onClick={clearDestination}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:text-white"
                        >
                          <X size={16} />
                        </button>
                      )}

                      {destinationSearching && <SearchLoading />}

                      {destinationResults.length > 0 && (
                        <LocationResults
                          results={destinationResults}
                          onSelect={selectDestination}
                        />
                      )}
                    </div>
                  </div>

                  {/* ROUTE LOADING */}

                  {routeLoading && (
                    <div className="mt-5 flex items-center gap-2 text-sm text-slate-400">
                      <Loader2 size={16} className="animate-spin" />
                      Calculating road route...
                    </div>
                  )}

                  {/* ROUTE ERROR */}

                  {routeError && (
                    <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                      {routeError}
                    </div>
                  )}

                  {/* ROUTE */}

                  {route && (
                    <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-900 p-4">
                      <div className="grid grid-cols-3 gap-3">
                        <RouteStat
                          label="Distance"
                          value={formatDistance(route.distance)}
                        />

                        <RouteStat
                          label="ETA"
                          value={formatDuration(route.duration)}
                        />

                        <RouteStat label="Est. fare" value={`৳${fare}`} />
                      </div>
                    </div>
                  )}

                  {/* REQUEST */}

                  <button
                    type="button"
                    onClick={handleRequestRide}
                    disabled={
                      !pickup ||
                      !destination ||
                      !route ||
                      routeLoading ||
                      rideLoading
                    }
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-sm font-bold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {rideLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Requesting...
                      </>
                    ) : (
                      <>
                        <Car size={18} />
                        Request a ride
                      </>
                    )}
                  </button>

                  <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck size={15} />
                    Safe and reliable rides
                  </div>
                </div>

                {/* MAP */}

                <div className="min-h-[430px] bg-slate-800 lg:min-h-[560px]">
                  <MapView
                    pickup={pickup}
                    destination={destination}
                    route={route}
                  />
                </div>
              </div>
            </section>
          )}

          {/* ==================================================
              STATS
          ================================================== */}

          <section className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={Car}
              label="Completed rides"
              value={completedRides}
            />

            <StatCard icon={Clock3} label="This month" value={monthlyRides} />

            <StatCard icon={Star} label="Rating" value="—" />
          </section>

          {/* ==================================================
              HISTORY
          ================================================== */}

          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Activity
                </p>

                <h3 className="mt-1 text-xl font-bold">Recent rides</h3>
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>

            {historyLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <Loader2
                  size={22}
                  className="mx-auto animate-spin text-slate-400"
                />

                <p className="mt-3 text-sm text-slate-500">Loading rides...</p>
              </div>
            ) : rideHistory.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <Car size={22} className="text-slate-400" />
                </div>

                <h4 className="mt-4 font-bold">No rides yet</h4>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Your rides will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {rideHistory.slice(0, 5).map((ride) => (
                  <RecentRide key={ride._id} ride={ride} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| DRIVER INFO
|--------------------------------------------------------------------------
*/

function DriverInfo({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        {icon}
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 text-sm font-bold capitalize text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| DRIVER STATUS
|--------------------------------------------------------------------------
*/

function getDriverStatus(status) {
  if (status === "accepted") {
    return "Accepted";
  }

  if (status === "driver_arriving") {
    return "Arriving";
  }

  if (status === "in_progress") {
    return "On trip";
  }

  return "Assigned";
}

/*
|--------------------------------------------------------------------------
| LOCATION RESULTS
|--------------------------------------------------------------------------
*/

function LocationResults({ results, onSelect }) {
  return (
    <div className="absolute left-0 right-0 top-full z-[1000] mt-2 max-h-64 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-2 shadow-2xl">
      {results.map((location) => (
        <button
          type="button"
          key={location.id}
          onClick={() => onSelect(location)}
          className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left hover:bg-slate-800"
        >
          <MapPin size={17} className="mt-0.5 shrink-0 text-slate-400" />

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {location.name}
            </p>

            <p className="mt-1 line-clamp-2 text-xs text-slate-500">
              {location.displayName || "Bangladesh"}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| SEARCH LOADING
|--------------------------------------------------------------------------
*/

function SearchLoading() {
  return (
    <div className="absolute right-4 top-1/2 z-10 -translate-y-1/2">
      <Loader2 size={17} className="animate-spin text-slate-500" />
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
        <div
          className={`h-2.5 w-2.5 rounded-full ${
            color === "emerald" ? "bg-emerald-500" : "bg-red-500"
          }`}
        />

        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
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
| ROUTE STAT
|--------------------------------------------------------------------------
*/

function RouteStat({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-white">{value}</p>
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
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold capitalize text-slate-900">
        {value}
      </p>
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
          <Icon size={17} />
        </div>
      </div>

      <p className="mt-4 text-2xl font-bold">{value}</p>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| RECENT RIDE
|--------------------------------------------------------------------------
*/

function RecentRide({ ride }) {
  const statusClass =
    ride.status === "completed"
      ? "bg-emerald-50 text-emerald-700"
      : ride.status === "cancelled"
        ? "bg-red-50 text-red-700"
        : ride.status === "accepted"
          ? "bg-indigo-50 text-indigo-700"
          : "bg-amber-50 text-amber-700";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />

            <p className="text-sm font-bold leading-6 text-slate-900">
              {ride.pickup?.address || "Pickup"}
            </p>
          </div>

          <div className="ml-1 mt-1 h-5 border-l border-dashed border-slate-300" />

          <div className="flex items-start gap-3">
            <MapPin size={15} className="mt-1 shrink-0 text-red-500" />

            <p className="text-sm font-bold leading-6 text-slate-900">
              {ride.destination?.address || "Destination"}
            </p>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <Clock3 size={13} />

            {formatRideDate(ride.createdAt || ride.requestedAt)}
          </div>

          {ride.driver?.name && (
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <User size={13} />
              Driver:{" "}
              <span className="font-semibold text-slate-700">
                {ride.driver.name}
              </span>
            </div>
          )}
        </div>

        <div className="text-left sm:text-right">
          <span
            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${statusClass}`}
          >
            {formatStatus(ride.status)}
          </span>

          <p className="mt-3 text-lg font-bold text-slate-950">
            ৳{Number(ride.estimatedFare || 0).toFixed(0)}
          </p>

          <p className="text-xs text-slate-400">
            {safeDistance(ride.distanceKm)}
          </p>
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
      .join("") || "G"
  );
}

/*
|--------------------------------------------------------------------------
| DISTANCE
|--------------------------------------------------------------------------
*/

function safeDistance(value) {
  const distance = Number(value);

  if (!Number.isFinite(distance) || distance <= 0 || distance > 200) {
    return "—";
  }

  return `${distance.toFixed(1)} km`;
}

/*
|--------------------------------------------------------------------------
| DURATION
|--------------------------------------------------------------------------
*/

function safeDuration(value) {
  const duration = Number(value);

  if (!Number.isFinite(duration) || duration <= 0 || duration > 600) {
    return "—";
  }

  return `${Math.round(duration)} min`;
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
| STATUS
|--------------------------------------------------------------------------
*/

function formatStatus(status) {
  if (!status) {
    return "Unknown";
  }

  return String(status)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/*
|--------------------------------------------------------------------------
| ACTIVE STATUS LABEL
|--------------------------------------------------------------------------
*/

function getRideStatusLabel(status) {
  const labels = {
    requested: "Ride Requested",

    searching: "Finding Driver",

    accepted: "Driver Accepted",

    driver_arriving: "Driver Arriving",

    in_progress: "Ride In Progress",

    completed: "Ride Completed",

    cancelled: "Ride Cancelled",
  };

  return labels[status] || "Ride Status";
}

/*
|--------------------------------------------------------------------------
| ACTIVE STATUS DESCRIPTION
|--------------------------------------------------------------------------
*/

function getRideStatusDescription(status) {
  const descriptions = {
    requested: "Your ride request has been sent.",

    searching: "We're looking for an available driver.",

    accepted: "Your driver has accepted the ride.",

    driver_arriving: "Your driver is coming to the pickup location.",

    in_progress: "You are currently on your way.",

    completed: "You have reached your destination.",

    cancelled: "This ride has been cancelled.",
  };

  return descriptions[status] || "Your ride status is being updated.";
}
