import { useEffect, useState } from "react";

import {
  Car,
  Clock3,
  Loader2,
  MapPin,
  Menu,
  Navigation,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

import MapView from "../../components/ui/MapView";

import {
  calculateFare,
  calculateRoute,
  formatDistance,
  formatDuration,
  searchLocation,
} from "../../services/mapService";

import { createRide } from "../../services/rideService";

export default function PassengerDashboard() {
  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [pickupText, setPickupText] = useState("");

  const [destinationText, setDestinationText] = useState("");

  const [pickup, setPickup] = useState(null);

  const [destination, setDestination] = useState(null);

  const [pickupResults, setPickupResults] = useState([]);

  const [destinationResults, setDestinationResults] = useState([]);

  const [searchingPickup, setSearchingPickup] = useState(false);

  const [searchingDestination, setSearchingDestination] = useState(false);

  const [route, setRoute] = useState(null);

  const [routeLoading, setRouteLoading] = useState(false);

  const [rideLoading, setRideLoading] = useState(false);

  const [routeError, setRouteError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Pickup Search
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (pickup) {
      setPickupResults([]);
      return;
    }

    if (pickupText.trim().length < 2) {
      setPickupResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchingPickup(true);

        const results = await searchLocation(pickupText);

        setPickupResults(results);
      } catch (error) {
        console.error("Pickup search error:", error);

        setPickupResults([]);
      } finally {
        setSearchingPickup(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [pickupText, pickup]);

  /*
  |--------------------------------------------------------------------------
  | Destination Search
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (destination) {
      setDestinationResults([]);
      return;
    }

    if (destinationText.trim().length < 2) {
      setDestinationResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchingDestination(true);

        const results = await searchLocation(destinationText);

        setDestinationResults(results);
      } catch (error) {
        console.error("Destination search error:", error);

        setDestinationResults([]);
      } finally {
        setSearchingDestination(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [destinationText, destination]);

  /*
  |--------------------------------------------------------------------------
  | Calculate Route
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!pickup || !destination) {
      setRoute(null);
      return;
    }

    const getRoute = async () => {
      try {
        setRouteLoading(true);
        setRouteError("");

        const result = await calculateRoute(pickup, destination);

        setRoute(result);
      } catch (error) {
        console.error("Route error:", error);

        setRoute(null);

        setRouteError("We couldn't find a route between these locations.");
      } finally {
        setRouteLoading(false);
      }
    };

    getRoute();
  }, [pickup, destination]);

  /*
  |--------------------------------------------------------------------------
  | Select Pickup
  |--------------------------------------------------------------------------
  */

  const selectPickup = (location) => {
    setPickup(location);

    setPickupText(location.name);

    setPickupResults([]);

    setRoute(null);
  };

  /*
  |--------------------------------------------------------------------------
  | Select Destination
  |--------------------------------------------------------------------------
  */

  const selectDestination = (location) => {
    setDestination(location);

    setDestinationText(location.name);

    setDestinationResults([]);

    setRoute(null);
  };

  /*
  |--------------------------------------------------------------------------
  | Clear Pickup
  |--------------------------------------------------------------------------
  */

  const clearPickup = () => {
    setPickup(null);
    setPickupText("");
    setRoute(null);
  };

  /*
  |--------------------------------------------------------------------------
  | Clear Destination
  |--------------------------------------------------------------------------
  */

  const clearDestination = () => {
    setDestination(null);
    setDestinationText("");
    setRoute(null);
  };

  /*
  |--------------------------------------------------------------------------
  | Request Ride
  |--------------------------------------------------------------------------
  */

  const handleRequestRide = async () => {
    if (!pickup || !destination || !route) {
      return;
    }

    try {
      setRideLoading(true);

      const response = await createRide({
        pickup,
        destination,
        route,
        estimatedFare: fare,
      });

      console.log("Ride created:", response.ride);

      alert("Ride requested successfully!");

      setPickup(null);
      setDestination(null);

      setPickupText("");
      setDestinationText("");

      setRoute(null);
    } catch (error) {
      console.error("Ride request error:", error);

      alert(error.response?.data?.message || "Failed to request ride.");
    } finally {
      setRideLoading(false);
    }
  };

  const fare = route ? calculateFare(route.distance) : 0;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      {/* Mobile overlay */}

      {sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
              <Navigation size={20} />
            </div>

            <div>
              <p className="font-bold tracking-tight">Gontobbo</p>

              <p className="text-[11px] text-slate-400">Passenger</p>
            </div>
          </div>

          <button
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
            onClick={logout}
            className="mt-3 w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}

      <main className="lg:pl-72">
        {/* Header */}

        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
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
            <div className="hidden text-right sm:block">
              <p className="text-xs text-slate-400">Welcome back</p>

              <p className="text-sm font-bold">{user?.name}</p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
              {getInitials(user?.name)}
            </div>
          </div>
        </header>

        {/* Content */}

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Welcome */}

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

          {/* Booking */}

          <section className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">
            <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
              {/* Booking Panel */}

              <div className="p-6 sm:p-8 lg:p-10">
                <div className="mb-8">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                    Book a ride
                  </p>

                  <h3 className="mt-2 text-2xl font-bold">
                    Get where you need to go.
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Choose your pickup and destination.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Pickup */}

                  <div className="relative">
                    <div className="absolute left-4 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
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
                        onClick={clearPickup}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    )}

                    {pickupResults.length > 0 && (
                      <LocationResults
                        results={pickupResults}
                        onSelect={selectPickup}
                      />
                    )}

                    {searchingPickup && <SearchLoading />}
                  </div>

                  {/* Destination */}

                  <div className="relative">
                    <div className="absolute left-4 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                      <MapPin size={15} />
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
                        onClick={clearDestination}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    )}

                    {destinationResults.length > 0 && (
                      <LocationResults
                        results={destinationResults}
                        onSelect={selectDestination}
                      />
                    )}

                    {searchingDestination && <SearchLoading />}
                  </div>
                </div>

                {/* Route loading */}

                {routeLoading && (
                  <div className="mt-5 flex items-center gap-2 text-sm text-slate-400">
                    <Loader2 size={16} className="animate-spin" />
                    Calculating route...
                  </div>
                )}

                {/* Error */}

                {routeError && (
                  <div className="mt-5 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {routeError}
                  </div>
                )}

                {/* Route details */}

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

                {/* Request ride */}

                <button
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

              {/* Map */}

              <div className="min-h-107.5 bg-slate-800 lg:min-h-140">
                <MapView
                  pickup={pickup}
                  destination={destination}
                  route={route}
                />
              </div>
            </div>
          </section>

          {/* Statistics */}

          <section className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard icon={Car} label="Total rides" value="0" />

            <StatCard icon={Clock3} label="This month" value="0" />

            <StatCard icon={Star} label="Rating" value="—" />
          </section>

          {/* Recent rides */}

          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Activity
                </p>

                <h3 className="mt-1 text-xl font-bold">Recent rides</h3>
              </div>

              <button className="text-sm font-semibold text-slate-500 hover:text-slate-950">
                View all
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <Car size={22} className="text-slate-400" />
              </div>

              <h4 className="mt-4 font-bold">No rides yet</h4>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Your completed rides will appear here.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Location Results
|--------------------------------------------------------------------------
*/

function LocationResults({ results, onSelect }) {
  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-2 shadow-2xl">
      {results.map((location) => (
        <button
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
              {location.displayName ||
                location.address?.city ||
                location.address?.town ||
                location.address?.state ||
                "Bangladesh"}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Search Loading
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
| Route Stat
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
| Stat Card
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
| Sidebar Item
|--------------------------------------------------------------------------
*/

function SidebarItem({ icon: Icon, label, active = false }) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
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
| User Initials
|--------------------------------------------------------------------------
*/

function getInitials(name = "") {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "G"
  );
}
