import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Bike,
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

const RIDE_POLL_INTERVAL = 4000;

export default function PassengerDashboard() {
  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [pickupText, setPickupText] = useState("");
  const [destinationText, setDestinationText] = useState("");

  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | VEHICLE TYPE
  |--------------------------------------------------------------------------
  */

  const [vehicleType, setVehicleType] = useState("car");

  const [pickupResults, setPickupResults] = useState([]);
  const [destinationResults, setDestinationResults] = useState([]);

  const [pickupSearching, setPickupSearching] = useState(false);
  const [destinationSearching, setDestinationSearching] = useState(false);

  const [route, setRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");

  const [activeRide, setActiveRide] = useState(null);
  const [rideHistory, setRideHistory] = useState([]);

  const [activeRideLoading, setActiveRideLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [rideLoading, setRideLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    return () => {
      setMounted(false);
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | PICKUP SEARCH
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
  | DESTINATION SEARCH
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
  | ROUTE
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
  | ACTIVE RIDE
  |--------------------------------------------------------------------------
  */

  const loadActiveRide = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setActiveRideLoading(true);
      }

      const response = await getActiveRide();

      const ride = response?.ride || null;

      if (ride && Number(ride.distanceKm) > 200) {
        setActiveRide(null);
        return;
      }

      setActiveRide(ride);
    } catch (error) {
      console.error("Active ride error:", error);

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
  | HISTORY
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
  | LOAD RIDES
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadActiveRide();
    loadRideHistory();

    const interval = window.setInterval(() => {
      loadActiveRide(true);
      loadRideHistory(true);
    }, RIDE_POLL_INTERVAL);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadActiveRide, loadRideHistory]);

  /*
  |--------------------------------------------------------------------------
  | LOCATION SELECTION
  |--------------------------------------------------------------------------
  */

  const selectPickup = (location) => {
    setPickup(location);

    setPickupText(location.name || location.displayName || "");

    setPickupResults([]);
    setRoute(null);
    setRouteError("");
  };

  const selectDestination = (location) => {
    setDestination(location);

    setDestinationText(location.name || location.displayName || "");

    setDestinationResults([]);
    setRoute(null);
    setRouteError("");
  };

  const clearPickup = () => {
    setPickup(null);
    setPickupText("");
    setPickupResults([]);
    setRoute(null);
    setRouteError("");
  };

  const clearDestination = () => {
    setDestination(null);
    setDestinationText("");
    setDestinationResults([]);
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

    try {
      const baseFare =
        Number(calculateFare(route.distanceKm, route.durationMinutes)) || 0;

      const multipliers = {
        car: 1,
        bike: 0.75,
        cng: 0.85,
      };

      return Math.round(baseFare * (multipliers[vehicleType] || 1));
    } catch (error) {
      console.error("Fare calculation error:", error);

      return 0;
    }
  }, [route, vehicleType]);

  /*
  |--------------------------------------------------------------------------
  | REQUEST RIDE
  |--------------------------------------------------------------------------
  */

  const handleRequestRide = async () => {
    if (!pickup) {
      setRouteError("Please select a pickup location.");
      return;
    }

    if (!destination) {
      setRouteError("Please select a destination.");
      return;
    }

    if (!route) {
      setRouteError("Please wait for the route to be calculated.");
      return;
    }

    if (!["car", "bike", "cng"].includes(vehicleType)) {
      setRouteError("Please select a valid vehicle type.");
      return;
    }

    if (activeRide) {
      setRouteError("You already have an active ride.");
      return;
    }

    try {
      setRideLoading(true);
      setRouteError("");

      const payload = {
        pickup: buildRideLocation(pickup),

        destination: buildRideLocation(destination),

        distanceKm: Number(route.distanceKm.toFixed(2)),

        durationMinutes: Number(route.durationMinutes.toFixed(1)),

        estimatedFare: fare,

        /*
        |--------------------------------------------------------------------------
        | IMPORTANT
        |--------------------------------------------------------------------------
        */

        vehicleType: vehicleType,
      };

      console.log("Creating ride with vehicle type:", vehicleType);

      console.log("CREATE RIDE PAYLOAD:", payload);

      const response = await createRide(payload);

      if (!mounted) {
        return;
      }

      const ride = response?.ride || response?.data?.ride || null;

      if (!ride) {
        throw new Error(
          "Ride was created but no ride information was returned.",
        );
      }

      setActiveRide(ride);

      setPickup(null);
      setDestination(null);

      setPickupText("");
      setDestinationText("");

      setPickupResults([]);
      setDestinationResults([]);

      setRoute(null);
      setRouteError("");
    } catch (error) {
      console.error("Create ride error:", error);

      if (!mounted) {
        return;
      }

      setRouteError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to request a ride. Please try again.",
      );
    } finally {
      if (mounted) {
        setRideLoading(false);
      }
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CANCEL
  |--------------------------------------------------------------------------
  */

  const handleCancelRide = async () => {
    if (!activeRide?.id && !activeRide?._id) {
      return;
    }

    try {
      setCancelLoading(true);

      const rideId = activeRide.id || activeRide._id;

      await cancelRide(rideId);

      setActiveRide(null);

      await loadRideHistory();
    } catch (error) {
      console.error("Cancel ride error:", error);

      setRouteError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to cancel the ride.",
      );
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
  | DERIVED
  |--------------------------------------------------------------------------
  */

  const driverAccepted = Boolean(
    activeRide?.driver &&
    ["accepted", "driver_arriving", "in_progress", "completed"].includes(
      activeRide.status,
    ),
  );

  const completedRides = rideHistory.filter(
    (ride) => ride.status === "completed",
  );

  const monthlyRides = completedRides.filter((ride) => {
    if (!ride.createdAt) {
      return false;
    }

    const date = new Date(ride.createdAt);

    const now = new Date();

    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }).length;

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      {/* MOBILE BACKDROP */}

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-[1050] bg-slate-950/40 lg:hidden"
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`fixed inset-y-0 left-0 z-[1100] w-72 transform border-r border-slate-200 bg-white transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                <Navigation size={20} />
              </div>

              <div>
                <p className="text-lg font-bold">Gontobbo</p>

                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Passenger
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            <SidebarItem icon={Navigation} label="Dashboard" active />

            <SidebarItem icon={Car} label="My Rides" />

            <SidebarItem icon={Star} label="Ratings" />

            <SidebarItem icon={ShieldCheck} label="Safety" />
          </nav>

          <div className="border-t border-slate-100 p-4">
            <div className="mb-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                {getInitials(user?.name)}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold">
                  {user?.name || "Passenger"}
                </p>

                <p className="truncate text-xs text-slate-400">{user?.email}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              <XCircle size={16} />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}

      <main className="relative z-0 lg:pl-72">
        {/* HEADER
            IMPORTANT:
            Higher z-index than map
        */}

        <header className="sticky top-0 z-[1000] flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
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

        <div className="relative z-0 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
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

          {/* ACTIVE RIDE */}

          {!activeRideLoading && activeRide && (
            <section className="relative z-0 mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
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
                        icon={<VehicleIcon type={activeRide.vehicleType} />}
                        label="Vehicle"
                        value={formatVehicleType(activeRide.vehicleType)}
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
                    label="Vehicle"
                    value={formatVehicleType(activeRide.vehicleType)}
                  />

                  <RideInfo
                    label="Fare"
                    value={`৳${Number(activeRide.estimatedFare || 0).toFixed(
                      0,
                    )}`}
                  />
                </div>

                {activeRide.status === "in_progress" && (
                  <div className="relative z-0 mt-6 overflow-hidden rounded-3xl">
                    <MapView
                      pickup={activeRide.pickup}
                      destination={activeRide.destination}
                      driverLocation={
                        activeRide.driver?.currentLocation ||
                        activeRide.driverLocation ||
                        null
                      }
                      route={null}
                    />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* BOOK RIDE */}

          {!activeRide && (
            <section className="relative z-0 mb-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
                <div className="mb-7">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                    Book a ride
                  </p>

                  <h3 className="mt-2 text-2xl font-bold">
                    Tell us where you want to go.
                  </h3>
                </div>

                {/* PICKUP */}

                <div className="relative z-50 mb-4">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Pickup
                  </label>

                  <div className="relative">
                    <div className="absolute left-4 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-500/10">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    </div>

                    <input
                      value={pickupText}
                      onChange={(event) => {
                        setPickup(null);
                        setPickupText(event.target.value);
                        setRoute(null);
                      }}
                      placeholder="Enter pickup location"
                      className="w-full rounded-2xl border border-slate-800 bg-slate-900 py-4 pl-14 pr-12 text-sm font-medium text-white outline-none transition placeholder:text-slate-600 focus:border-slate-600"
                    />

                    {pickupSearching && <SearchLoading />}

                    {pickup && (
                      <button
                        type="button"
                        onClick={clearPickup}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {!pickup && pickupResults.length > 0 && (
                    <LocationResults
                      results={pickupResults}
                      onSelect={selectPickup}
                    />
                  )}
                </div>

                {/* DESTINATION */}

                <div className="relative z-40 mb-6">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Destination
                  </label>

                  <div className="relative">
                    <div className="absolute left-4 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-red-500/10">
                      <MapPin size={15} className="text-red-400" />
                    </div>

                    <input
                      value={destinationText}
                      onChange={(event) => {
                        setDestination(null);

                        setDestinationText(event.target.value);

                        setRoute(null);
                      }}
                      placeholder="Where are you going?"
                      className="w-full rounded-2xl border border-slate-800 bg-slate-900 py-4 pl-14 pr-12 text-sm font-medium text-white outline-none transition placeholder:text-slate-600 focus:border-slate-600"
                    />

                    {destinationSearching && <SearchLoading />}

                    {destination && (
                      <button
                        type="button"
                        onClick={clearDestination}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {!destination && destinationResults.length > 0 && (
                    <LocationResults
                      results={destinationResults}
                      onSelect={selectDestination}
                    />
                  )}
                </div>

                {/* VEHICLE */}

                <div className="mb-6">
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Choose your vehicle
                    </label>

                    <span className="text-xs font-semibold text-slate-500">
                      Selected:{" "}
                      <span className="text-white">
                        {formatVehicleType(vehicleType)}
                      </span>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <VehicleOption
                      type="car"
                      label="Car"
                      description="Comfort"
                      icon={<Car size={19} />}
                      selected={vehicleType === "car"}
                      onClick={() => setVehicleType("car")}
                    />

                    <VehicleOption
                      type="bike"
                      label="Bike"
                      description="Fast"
                      icon={<Bike size={19} />}
                      selected={vehicleType === "bike"}
                      onClick={() => setVehicleType("bike")}
                    />

                    <VehicleOption
                      type="cng"
                      label="CNG"
                      description="Economy"
                      icon={<Car size={19} />}
                      selected={vehicleType === "cng"}
                      onClick={() => setVehicleType("cng")}
                    />
                  </div>
                </div>

                {routeLoading && (
                  <div className="mb-5 flex items-center gap-3 rounded-2xl bg-slate-900 p-4 text-sm text-slate-400">
                    <Loader2 size={18} className="animate-spin" />
                    Calculating route...
                  </div>
                )}

                {routeError && (
                  <div className="mb-5 rounded-2xl border border-red-900/50 bg-red-950/40 p-4 text-sm leading-6 text-red-300">
                    {routeError}
                  </div>
                )}

                {route && (
                  <div className="mb-5 grid grid-cols-3 gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
                    <RouteStat
                      label="Distance"
                      value={formatDistance(route.distanceKm)}
                    />

                    <RouteStat
                      label="Time"
                      value={formatDuration(route.durationMinutes)}
                    />

                    <RouteStat label="Fare" value={`৳${fare}`} />
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleRequestRide}
                  disabled={
                    rideLoading ||
                    routeLoading ||
                    !route ||
                    !pickup ||
                    !destination
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-sm font-bold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {rideLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Requesting ride...
                    </>
                  ) : (
                    <>
                      <Navigation size={18} />
                      Request {formatVehicleType(vehicleType)}
                    </>
                  )}
                </button>
              </div>

              {/* MAP
                  IMPORTANT:
                  z-0 keeps map below navbar
              */}

              <div className="relative z-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <MapView
                  pickup={pickup}
                  destination={destination}
                  route={route}
                />
              </div>
            </section>
          )}

          {/* STATS */}

          <section className="relative z-0 mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon={Car}
              label="Total rides"
              value={rideHistory.length}
            />

            <StatCard icon={Clock3} label="This month" value={monthlyRides} />

            <StatCard icon={Star} label="Rating" value="—" />
          </section>

          {/* HISTORY */}

          <section className="relative z-0">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  Activity
                </p>

                <h3 className="mt-1 text-2xl font-bold">Recent rides</h3>
              </div>
            </div>

            {historyLoading ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
                <Loader2
                  size={24}
                  className="mx-auto animate-spin text-slate-400"
                />

                <p className="mt-3 text-sm text-slate-400">
                  Loading your ride history...
                </p>
              </div>
            ) : rideHistory.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <Car size={22} className="text-slate-400" />
                </div>

                <h4 className="mt-4 font-bold">No rides yet</h4>

                <p className="mt-1 text-sm text-slate-400">
                  Your completed rides will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {rideHistory.slice(0, 10).map((ride) => (
                  <RecentRide key={ride.id || ride._id} ride={ride} />
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
| COMPONENTS
|--------------------------------------------------------------------------
*/

function VehicleIcon({ type }) {
  if (type === "bike") {
    return <Bike size={16} />;
  }

  return <Car size={16} />;
}

function DriverInfo({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-4">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}

        <span className="text-[10px] font-bold uppercase tracking-wider">
          {label}
        </span>
      </div>

      <p className="mt-2 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function VehicleOption({ type, label, description, icon, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`relative rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-white bg-white text-slate-950 shadow-lg"
          : "border-slate-800 bg-slate-900 text-white hover:border-slate-600"
      }`}
    >
      {selected && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
          <CheckCircle2 size={14} />
        </span>
      )}

      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          selected ? "bg-slate-100" : "bg-slate-800"
        }`}
      >
        {icon}
      </div>

      <p className="mt-3 text-sm font-bold">{label}</p>

      <p className="mt-1 text-[11px] text-slate-500">{description}</p>

      <span className="sr-only">Vehicle type: {type}</span>
    </button>
  );
}

function LocationResults({ results, onSelect }) {
  return (
    <div className="absolute left-0 right-0 top-full z-[2000] mt-2 max-h-64 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-2 shadow-2xl">
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

function SearchLoading() {
  return (
    <div className="absolute right-4 top-1/2 z-10 -translate-y-1/2">
      <Loader2 size={17} className="animate-spin text-slate-500" />
    </div>
  );
}

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

          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <VehicleIcon type={ride.vehicleType} />

            <span>{formatVehicleType(ride.vehicleType)}</span>
          </div>
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
| HELPERS
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

function formatVehicleType(type) {
  if (type === "bike") {
    return "Bike";
  }

  if (type === "cng") {
    return "CNG";
  }

  return "Car";
}

function safeDistance(value) {
  const distance = Number(value);

  if (!Number.isFinite(distance) || distance <= 0 || distance > 200) {
    return "—";
  }

  return `${distance.toFixed(1)} km`;
}

function safeDuration(value) {
  const duration = Number(value);

  if (!Number.isFinite(duration) || duration <= 0 || duration > 600) {
    return "—";
  }

  return `${Math.round(duration)} min`;
}

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

function formatStatus(status) {
  if (!status) {
    return "Unknown";
  }

  return String(status)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

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

function getDriverStatus(status) {
  if (status === "accepted") {
    return "Accepted";
  }

  if (status === "driver_arriving") {
    return "Coming to pickup";
  }

  if (status === "in_progress") {
    return "On trip";
  }

  if (status === "completed") {
    return "Completed";
  }

  return "Connected";
}
