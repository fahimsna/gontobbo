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
  ArrowRight,
  ChevronRight,
  LocateFixed,
  Sparkles,
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
  rateRide,
} from "../../services/rideService";

const RIDE_POLL_INTERVAL = 4000;

export default function PassengerDashboard() {
  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [pickupText, setPickupText] = useState("");
  const [destinationText, setDestinationText] = useState("");

  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);

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

  const [ratingRide, setRatingRide] = useState(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingMessage, setRatingMessage] = useState("");

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

      try {
        const ratedIds = JSON.parse(
          window.localStorage.getItem("gontobbo_rated_ride_ids") || "[]",
        );

        const ratedSet = new Set(Array.isArray(ratedIds) ? ratedIds : []);

        const unratedCompletedRide = validRides.find((ride) => {
          const id = ride?._id || ride?.id;

          return (
            ride?.status === "completed" &&
            ride?.driver &&
            id &&
            !ratedSet.has(String(id))
          );
        });

        if (unratedCompletedRide) {
          setRatingRide((current) => current || unratedCompletedRide);
        }
      } catch (storageError) {
        console.error("Rating storage error:", storageError);
      }
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
  | LOCATION
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
        vehicleType,
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
  | RATING
  |--------------------------------------------------------------------------
  */

  const openRating = (ride) => {
    if (!ride) {
      return;
    }

    setRatingRide(ride);
    setSelectedRating(0);
    setRatingComment("");
    setRatingMessage("");
  };

  const closeRating = () => {
    if (ratingLoading) {
      return;
    }

    setRatingRide(null);
    setSelectedRating(0);
    setRatingComment("");
    setRatingMessage("");
  };

  const handleSubmitRating = async () => {
    const rideId = ratingRide?._id || ratingRide?.id;

    if (!rideId) {
      setRatingMessage("This ride could not be identified.");
      return;
    }

    if (!selectedRating) {
      setRatingMessage("Please select a rating from 1 to 5 stars.");
      return;
    }

    try {
      setRatingLoading(true);
      setRatingMessage("");

      await rateRide(rideId, selectedRating, ratingComment.trim());

      try {
        const existing = JSON.parse(
          window.localStorage.getItem("gontobbo_rated_ride_ids") || "[]",
        );

        const ids = Array.isArray(existing) ? existing : [];

        if (!ids.includes(String(rideId))) {
          ids.push(String(rideId));
        }

        window.localStorage.setItem(
          "gontobbo_rated_ride_ids",
          JSON.stringify(ids.slice(-100)),
        );
      } catch (storageError) {
        console.error("Rating storage save error:", storageError);
      }

      setRideHistory((current) =>
        current.map((ride) =>
          String(ride?._id || ride?.id) === String(rideId)
            ? {
                ...ride,
                rating: selectedRating,
                ratingComment: ratingComment.trim(),
              }
            : ride,
        ),
      );

      setRatingMessage("Thank you! Your rating has been submitted.");

      window.setTimeout(() => {
        setRatingRide(null);
        setSelectedRating(0);
        setRatingComment("");
        setRatingMessage("");
      }, 1200);
    } catch (error) {
      console.error("Rate ride error:", error);

      setRatingMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to submit your rating. Please try again.",
      );
    } finally {
      setRatingLoading(false);
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

  const averageRating = useMemo(() => {
    const ratings = completedRides
      .map((ride) => Number(ride.rating))
      .filter((rating) => rating >= 1 && rating <= 5);

    if (!ratings.length) {
      return "—";
    }

    const average =
      ratings.reduce((total, rating) => total + rating, 0) / ratings.length;

    return average.toFixed(1);
  }, [completedRides]);

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-950">
      {/* MOBILE OVERLAY */}

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-[1050] bg-slate-950/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`fixed inset-y-0 left-0 z-[1100] flex w-[280px] flex-col border-r border-slate-200/80 bg-white transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-[78px] items-center border-b border-slate-100 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white shadow-lg shadow-slate-950/10">
              <Navigation size={19} strokeWidth={2.5} />
            </div>

            <div>
              <p className="text-[17px] font-black tracking-tight">Gontobbo</p>

              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">
                Passenger
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="ml-auto rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-7">
          <p className="px-3 text-[9px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
            Overview
          </p>

          <div className="mt-3 space-y-1">
            <SidebarItem icon={Navigation} label="Dashboard" active />

            <SidebarItem icon={Car} label="My Rides" />

            <SidebarItem icon={Clock3} label="Ride History" />

            <SidebarItem icon={Star} label="Ratings" />
          </div>

          <p className="mt-9 px-3 text-[9px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
            Account
          </p>

          <div className="mt-3 space-y-1">
            <SidebarItem icon={ShieldCheck} label="Account" />

            <SidebarItem icon={User} label="Profile" />
          </div>

          <div className="mt-10 rounded-2xl bg-slate-950 p-4 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
              <ShieldCheck size={17} />
            </div>

            <p className="mt-4 text-sm font-bold">Safe rides, every time.</p>

            <p className="mt-1 text-xs leading-5 text-slate-400">
              Your ride information is protected by Gontobbo.
            </p>
          </div>
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
              {getInitials(user?.name)}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold">
                {user?.name || "Passenger"}
              </p>

              <p className="truncate text-[11px] text-slate-400">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-500 transition hover:border-red-100 hover:bg-red-50 hover:text-red-600"
          >
            <XCircle size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* MAIN */}

      <main className="relative z-0 lg:pl-[280px]">
        {/* HEADER */}

        <header className="sticky top-0 z-[1000] flex h-[78px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 lg:hidden"
            >
              <Menu size={21} />
            </button>

            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                Passenger portal
              </p>

              <h1 className="mt-0.5 text-base font-black tracking-tight sm:text-lg">
                Dashboard
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-950 disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin" : ""}
              />

              <span className="hidden sm:inline">Refresh</span>
            </button>

            <div className="hidden border-l border-slate-200 pl-4 text-right sm:block">
              <p className="text-[10px] font-medium text-slate-400">
                Welcome back
              </p>

              <p className="text-sm font-bold text-slate-900">
                {user?.name || "Passenger"}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white ring-4 ring-slate-100">
              {getInitials(user?.name)}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1400px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          {/* HERO */}

          <section className="mb-8">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Gontobbo is ready
                  </span>
                </div>

                <h2 className="max-w-2xl text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl lg:text-[42px]">
                  Where are you going,
                  <span className="text-slate-400">
                    {" "}
                    {user?.name?.split(" ")[0] || "today"}?
                  </span>
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                  Book a reliable ride, track your driver and get where you need
                  to be without the hassle.
                </p>
              </div>

              <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Sparkles size={15} />
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Available now
                  </p>

                  <p className="text-xs font-bold text-slate-800">
                    Drivers are online
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ACTIVE RIDE */}

          {!activeRideLoading && activeRide && (
            <section className="relative z-0 mb-8 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
              <div
                className={`border-b px-5 py-5 sm:px-7 ${
                  driverAccepted
                    ? "border-emerald-100 bg-gradient-to-r from-emerald-50 to-white"
                    : "border-amber-100 bg-gradient-to-r from-amber-50 to-white"
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

                      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
                        Current ride
                      </p>
                    </div>

                    <h3 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">
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
                      className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-xs font-bold text-red-600 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
                    >
                      {cancelLoading ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <X size={15} />
                      )}
                      Cancel ride
                    </button>
                  )}
                </div>
              </div>

              {driverAccepted && (
                <div className="border-b border-slate-100 p-5 sm:p-7">
                  <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-white p-5">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white shadow-lg">
                            {getInitials(activeRide.driver?.name)}
                          </div>

                          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500">
                            <CheckCircle2 size={11} className="text-white" />
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-black">
                              {activeRide.driver?.name || "Your driver"}
                            </h4>

                            <CheckCircle2
                              size={16}
                              className="text-emerald-500"
                            />
                          </div>

                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                            <Star
                              size={13}
                              className="fill-amber-400 text-amber-400"
                            />

                            <span>Verified Gontobbo driver</span>
                          </div>
                        </div>
                      </div>

                      {activeRide.driver?.phone && (
                        <a
                          href={`tel:${activeRide.driver.phone}`}
                          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
                        >
                          <Phone size={15} />
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
                        icon={<Navigation size={15} />}
                        label="Trip status"
                        value={getDriverStatus(activeRide.status)}
                      />

                      <DriverInfo
                        icon={<Wifi size={15} />}
                        label="Connection"
                        value="Live"
                      />
                    </div>
                  </div>
                </div>
              )}

              {!driverAccepted &&
                ["requested", "searching"].includes(activeRide.status) && (
                  <div className="border-b border-slate-100 p-5 sm:p-7">
                    <div className="rounded-[24px] border border-amber-100 bg-amber-50/80 p-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
                          <Loader2
                            size={23}
                            className="animate-spin text-amber-600"
                          />
                        </div>

                        <div>
                          <h4 className="font-black text-slate-900">
                            Finding your driver
                          </h4>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            We're checking nearby approved drivers for your
                            ride.
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-amber-100">
                        <div className="h-full w-1/2 animate-pulse rounded-full bg-amber-400" />
                      </div>
                    </div>
                  </div>
                )}

              <div className="p-5 sm:p-7">
                <div className="grid gap-3 md:grid-cols-2">
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

                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                  <div className="relative z-0 mt-5 overflow-hidden rounded-[24px] border border-slate-200">
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

          {/* BOOKING */}

          {!activeRide && (
            <section className="relative z-0 mb-9 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
              {/* BOOKING PANEL */}

              <div className="relative overflow-visible rounded-[28px] bg-slate-950 p-5 text-white shadow-[0_20px_50px_rgba(15,23,42,0.15)] sm:p-7 lg:p-8">
                <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-white/[0.025] blur-3xl" />

                <div className="relative">
                  <div className="mb-7">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                      <Navigation size={11} className="text-emerald-400" />

                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        Quick booking
                      </span>
                    </div>

                    <h3 className="text-2xl font-black tracking-tight">
                      Plan your journey.
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Enter your pickup and destination to see the route and
                      estimated fare.
                    </p>
                  </div>

                  {/* PICKUP */}

                  <div className="relative z-[60] mb-4">
                    <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
                      Pickup location
                    </label>

                    <div className="relative">
                      <div className="absolute left-4 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-400/10">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.08)]" />
                      </div>

                      <input
                        value={pickupText}
                        onChange={(event) => {
                          setPickup(null);
                          setPickupText(event.target.value);
                          setRoute(null);
                        }}
                        placeholder="Where should we pick you up?"
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.055] py-4 pl-14 pr-12 text-sm font-medium text-white outline-none transition placeholder:text-slate-600 hover:border-white/15 focus:border-emerald-400/50 focus:bg-white/[0.07] focus:ring-4 focus:ring-emerald-400/5"
                      />

                      {pickupSearching && <SearchLoading />}

                      {pickupText && !pickup && !pickupSearching && (
                        <button
                          type="button"
                          onClick={clearPickup}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:bg-white/10 hover:text-white"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>

                    {pickupResults.length > 0 && (
                      <LocationResults
                        results={pickupResults}
                        onSelect={selectPickup}
                      />
                    )}
                  </div>

                  {/* DESTINATION */}

                  <div className="relative z-[50] mb-6">
                    <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
                      Destination
                    </label>

                    <div className="relative">
                      <div className="absolute left-4 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-red-400/10">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-400 shadow-[0_0_0_4px_rgba(248,113,113,0.08)]" />
                      </div>

                      <input
                        value={destinationText}
                        onChange={(event) => {
                          setDestination(null);
                          setDestinationText(event.target.value);
                          setRoute(null);
                        }}
                        placeholder="Where are you going?"
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.055] py-4 pl-14 pr-12 text-sm font-medium text-white outline-none transition placeholder:text-slate-600 hover:border-white/15 focus:border-red-400/40 focus:bg-white/[0.07] focus:ring-4 focus:ring-red-400/5"
                      />

                      {destinationSearching && <SearchLoading />}

                      {destinationText &&
                        !destination &&
                        !destinationSearching && (
                          <button
                            type="button"
                            onClick={clearDestination}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:bg-white/10 hover:text-white"
                          >
                            <X size={15} />
                          </button>
                        )}
                    </div>

                    {destinationResults.length > 0 && (
                      <LocationResults
                        results={destinationResults}
                        onSelect={selectDestination}
                      />
                    )}
                  </div>

                  {/* VEHICLES */}

                  <div className="mb-6">
                    <div className="mb-3 flex items-center justify-between">
                      <label className="block text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
                        Choose vehicle
                      </label>

                      <span className="text-[10px] font-medium text-slate-600">
                        Select your preference
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <VehicleOption
                        type="car"
                        label="Car"
                        description="Comfort"
                        icon={<Car size={18} />}
                        selected={vehicleType === "car"}
                        onClick={() => setVehicleType("car")}
                      />

                      <VehicleOption
                        type="bike"
                        label="Bike"
                        description="Fast"
                        icon={<Bike size={18} />}
                        selected={vehicleType === "bike"}
                        onClick={() => setVehicleType("bike")}
                      />

                      <VehicleOption
                        type="cng"
                        label="CNG"
                        description="Economy"
                        icon={<Car size={18} />}
                        selected={vehicleType === "cng"}
                        onClick={() => setVehicleType("cng")}
                      />
                    </div>
                  </div>

                  {/* ROUTE LOADING */}

                  {routeLoading && (
                    <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5">
                        <Loader2
                          size={16}
                          className="animate-spin text-slate-400"
                        />
                      </div>

                      <div>
                        <p className="text-xs font-bold text-white">
                          Calculating route
                        </p>

                        <p className="mt-0.5 text-[10px] text-slate-500">
                          Finding the best available route...
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ERROR */}

                  {routeError && (
                    <div className="mb-5 flex gap-3 rounded-2xl border border-red-900/50 bg-red-950/30 p-4 text-sm leading-6 text-red-300">
                      <XCircle size={17} className="mt-0.5 shrink-0" />

                      <span>{routeError}</span>
                    </div>
                  )}

                  {/* ROUTE SUMMARY */}

                  {route && (
                    <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                      <div className="grid grid-cols-3 divide-x divide-white/10">
                        <RouteStat
                          label="Distance"
                          value={formatDistance(route.distanceKm)}
                        />

                        <RouteStat
                          label="Time"
                          value={formatDuration(route.durationMinutes)}
                        />

                        <RouteStat label="Estimated fare" value={`৳${fare}`} />
                      </div>
                    </div>
                  )}

                  {/* BUTTON */}

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
                    className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-sm font-extrabold text-slate-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    {rideLoading ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        Requesting ride...
                      </>
                    ) : (
                      <>
                        Request {formatVehicleType(vehicleType)}
                        <ArrowRight
                          size={17}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* MAP */}

              <div className="relative z-0 min-h-[430px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
                <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-xl border border-white/70 bg-white/90 px-3 py-2 shadow-lg backdrop-blur">
                  <LocateFixed size={14} className="text-slate-700" />

                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                    Live route preview
                  </span>
                </div>

                <MapView
                  pickup={pickup}
                  destination={destination}
                  route={route}
                />
              </div>
            </section>
          )}

          {/* STATS */}

          <section className="relative z-0 mb-9 grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={Car}
              label="Total rides"
              value={rideHistory.length}
              description="All ride requests"
            />

            <StatCard
              icon={Clock3}
              label="This month"
              value={monthlyRides}
              description="Completed rides"
            />

            <StatCard
              icon={Star}
              label="Your rating"
              value={averageRating}
              description="Average driver rating"
            />
          </section>

          {/* HISTORY */}

          <section className="relative z-0">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
                  Activity
                </p>

                <h3 className="mt-1 text-2xl font-black tracking-tight">
                  Recent rides
                </h3>
              </div>

              {rideHistory.length > 0 && (
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-500">
                  {rideHistory.length} ride
                  {rideHistory.length === 1 ? "" : "s"}
                </span>
              )}
            </div>

            {historyLoading ? (
              <div className="rounded-[28px] border border-slate-200 bg-white p-12 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                  <Loader2 size={21} className="animate-spin text-slate-400" />
                </div>

                <p className="mt-4 text-sm font-bold text-slate-700">
                  Loading your ride history
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  This will only take a moment.
                </p>
              </div>
            ) : rideHistory.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <Car size={22} className="text-slate-400" />
                </div>

                <h4 className="mt-5 text-base font-black">No rides yet</h4>

                <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-400">
                  Your ride activity will appear here after you book your first
                  trip.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {rideHistory.slice(0, 10).map((ride) => (
                  <RecentRide
                    key={ride.id || ride._id}
                    ride={ride}
                    onRate={openRating}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* RATING MODAL */}

      {ratingRide && (
        <RatingModal
          ride={ratingRide}
          selectedRating={selectedRating}
          setSelectedRating={setSelectedRating}
          ratingComment={ratingComment}
          setRatingComment={setRatingComment}
          ratingLoading={ratingLoading}
          ratingMessage={ratingMessage}
          onClose={closeRating}
          onSubmit={handleSubmitRating}
        />
      )}
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
    <div className="rounded-2xl border border-emerald-100/80 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}

        <span className="text-[9px] font-extrabold uppercase tracking-[0.16em]">
          {label}
        </span>
      </div>

      <p className="mt-2 text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}

function VehicleOption({ type, label, description, icon, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`group relative rounded-2xl border p-3.5 text-left transition-all duration-200 ${
        selected
          ? "border-white bg-white text-slate-950 shadow-xl shadow-black/10"
          : "border-white/10 bg-white/[0.035] text-white hover:border-white/20 hover:bg-white/[0.06]"
      }`}
    >
      {selected && (
        <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
          <CheckCircle2 size={12} />
        </span>
      )}

      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
          selected
            ? "bg-slate-100 text-slate-950"
            : "bg-white/[0.07] text-slate-300"
        }`}
      >
        {icon}
      </div>

      <p className="mt-3 text-xs font-extrabold">{label}</p>

      <p
        className={`mt-1 text-[10px] ${
          selected ? "text-slate-500" : "text-slate-600"
        }`}
      >
        {description}
      </p>

      <span className="sr-only">Vehicle type: {type}</span>
    </button>
  );
}

function LocationResults({ results, onSelect }) {
  return (
    <div className="absolute left-0 right-0 top-full z-[2000] mt-2 max-h-64 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-2 shadow-2xl shadow-black/30">
      {results.map((location) => (
        <button
          type="button"
          key={location.id}
          onClick={() => onSelect(location)}
          className="group flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white/5"
        >
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5">
            <MapPin
              size={15}
              className="text-slate-400 group-hover:text-emerald-400"
            />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {location.name}
            </p>

            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
              {location.displayName || "Bangladesh"}
            </p>
          </div>

          <ChevronRight
            size={14}
            className="ml-auto mt-1 shrink-0 text-slate-700 group-hover:text-slate-400"
          />
        </button>
      ))}
    </div>
  );
}

function SearchLoading() {
  return (
    <div className="absolute right-4 top-1/2 z-10 -translate-y-1/2">
      <Loader2 size={16} className="animate-spin text-slate-500" />
    </div>
  );
}

function LocationCard({ label, value, color }) {
  const emerald = color === "emerald";

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            emerald ? "bg-emerald-500" : "bg-red-500"
          }`}
        />

        <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
          {label}
        </p>
      </div>

      <p className="mt-2 line-clamp-2 text-sm font-bold leading-6 text-slate-800">
        {value}
      </p>
    </div>
  );
}

function RouteStat({ label, value }) {
  return (
    <div className="px-3 first:pl-0 last:pr-0">
      <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-slate-500">
        {label}
      </p>

      <p className="mt-1.5 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function RideInfo({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
        {label}
      </p>

      <p className="mt-1.5 truncate text-sm font-black capitalize text-slate-900">
        {value}
      </p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, description }) {
  return (
    <div className="group rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
            {label}
          </p>

          <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">{description}</p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-slate-950 group-hover:text-white">
          <Icon size={17} />
        </div>
      </div>
    </div>
  );
}

function RecentRide({ ride, onRate }) {
  const statusClass =
    ride.status === "completed"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : ride.status === "cancelled"
        ? "bg-red-50 text-red-700 border-red-100"
        : ride.status === "accepted"
          ? "bg-indigo-50 text-indigo-700 border-indigo-100"
          : "bg-amber-50 text-amber-700 border-amber-100";

  return (
    <div className="group rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:p-6">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>

            <p className="max-w-2xl text-sm font-bold leading-6 text-slate-900">
              {ride.pickup?.address || "Pickup"}
            </p>
          </div>

          <div className="ml-[13px] h-5 border-l border-dashed border-slate-300" />

          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-50">
              <MapPin size={13} className="text-red-500" />
            </div>

            <p className="max-w-2xl text-sm font-bold leading-6 text-slate-900">
              {ride.destination?.address || "Destination"}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock3 size={12} />
              {formatRideDate(ride.createdAt || ride.requestedAt)}
            </span>

            <span className="flex items-center gap-1.5">
              <VehicleIcon type={ride.vehicleType} />
              {formatVehicleType(ride.vehicleType)}
            </span>

            {ride.driver?.name && (
              <span className="flex items-center gap-1.5">
                <User size={12} />
                <span>Driver:</span>
                <span className="font-bold text-slate-600">
                  {ride.driver.name}
                </span>
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-row items-center justify-between gap-4 border-t border-slate-100 pt-4 sm:min-w-[150px] sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
          <div className="text-left sm:text-right">
            <span
              className={`inline-flex rounded-full border px-3 py-1.5 text-[10px] font-extrabold ${statusClass}`}
            >
              {formatStatus(ride.status)}
            </span>

            <p className="mt-3 text-lg font-black text-slate-950">
              ৳
              {Number(
                ride.finalFare ?? ride.estimatedFare ?? ride.fare ?? 0,
              ).toFixed(0)}
            </p>

            <p className="text-[10px] font-medium text-slate-400">
              {safeDistance(ride.distanceKm)}
            </p>
          </div>

          {ride.status === "completed" && !ride.rating && (
            <button
              type="button"
              onClick={() => onRate?.(ride)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-3.5 py-2.5 text-[10px] font-extrabold text-slate-950 shadow-sm transition hover:bg-amber-300"
            >
              <Star size={13} className="fill-current" />
              Rate driver
            </button>
          )}

          {ride.status === "completed" && ride.rating && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
              <Star size={13} className="fill-current" />
              {ride.rating}/5
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| RATING MODAL
|--------------------------------------------------------------------------
*/

function RatingModal({
  ride,
  selectedRating,
  setSelectedRating,
  ratingComment,
  setRatingComment,
  ratingLoading,
  ratingMessage,
  onClose,
  onSubmit,
}) {
  const successful = ratingMessage?.toLowerCase().includes("thank");

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md">
      <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-[0_25px_80px_rgba(15,23,42,0.25)]">
        <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
                Ride completed
              </p>

              <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                Rate your driver
              </h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={ratingLoading}
              className="rounded-xl p-2.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-950 disabled:opacity-40"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-7">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                {getInitials(ride?.driver?.name || "Driver")}
              </div>

              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                  Driver
                </p>

                <p className="mt-1 text-sm font-black text-slate-900">
                  {ride?.driver?.name || "Your driver"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7 text-center">
            <p className="text-sm font-bold text-slate-600">
              How was your ride?
            </p>

            <div
              className="mt-4 flex justify-center gap-1.5"
              role="radiogroup"
              aria-label="Driver rating"
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSelectedRating(star)}
                  disabled={ratingLoading}
                  aria-label={`${star} star${star === 1 ? "" : "s"}`}
                  aria-pressed={selectedRating === star}
                  className="rounded-xl p-1.5 transition hover:scale-110 disabled:opacity-50"
                >
                  <Star
                    size={34}
                    strokeWidth={1.8}
                    className={
                      star <= selectedRating
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300"
                    }
                  />
                </button>
              ))}
            </div>

            <p className="mt-2 text-[11px] font-bold text-slate-400">
              {selectedRating === 0
                ? "Tap a star to rate your experience"
                : `${selectedRating} out of 5 stars`}
            </p>
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
              Comment{" "}
              <span className="font-normal normal-case">(optional)</span>
            </label>

            <textarea
              value={ratingComment}
              onChange={(event) =>
                setRatingComment(event.target.value.slice(0, 500))
              }
              disabled={ratingLoading}
              rows={4}
              placeholder="Tell us about your ride..."
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-950/5 disabled:opacity-50"
            />

            <p className="mt-1 text-right text-[10px] text-slate-400">
              {ratingComment.length}/500
            </p>
          </div>

          {ratingMessage && (
            <div
              className={`mt-4 rounded-2xl px-4 py-3 text-xs font-bold ${
                successful
                  ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                  : "border border-slate-100 bg-slate-50 text-slate-600"
              }`}
            >
              {ratingMessage}
            </div>
          )}

          <button
            type="button"
            onClick={onSubmit}
            disabled={ratingLoading || selectedRating === 0}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 py-4 text-sm font-extrabold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {ratingLoading ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Star size={17} className="fill-amber-400 text-amber-400" />
                Submit rating
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active = false }) {
  return (
    <button
      type="button"
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition ${
        active
          ? "bg-slate-950 text-white shadow-lg shadow-slate-950/10"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
      }`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
          active ? "bg-white/10" : "bg-transparent group-hover:bg-white"
        }`}
      >
        <Icon size={16} />
      </span>

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
