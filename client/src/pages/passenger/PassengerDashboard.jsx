import { useState } from "react";

import {
  Car,
  Clock3,
  History,
  LogOut,
  MapPin,
  Menu,
  Navigation,
  Search,
  User,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import MapView from "../../components/ui/MapView";

import { searchLocation, getRoute } from "../../services/mapService";

export default function PassengerDashboard() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  /*
  |--------------------------------------------------------------------------
  | UI state
  |--------------------------------------------------------------------------
  */

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [searching, setSearching] = useState(false);

  const [searchingLocation, setSearchingLocation] = useState(false);

  const [mapError, setMapError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Location state
  |--------------------------------------------------------------------------
  */

  const [pickup, setPickup] = useState([23.7806, 90.4258]);

  const [destination, setDestination] = useState(null);

  const [route, setRoute] = useState(null);

  const [pickupText, setPickupText] = useState("Merul Badda, Dhaka");

  const [destinationText, setDestinationText] = useState("");

  const [suggestions, setSuggestions] = useState([]);

  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  */

  const handleLogout = () => {
    logout();

    navigate("/login");
  };

  /*
  |--------------------------------------------------------------------------
  | Search destination
  |--------------------------------------------------------------------------
  */

  const handleSearch = async () => {
    if (!destinationText.trim()) {
      return;
    }

    try {
      setSearchingLocation(true);

      setMapError("");

      setSuggestions([]);

      const results = await searchLocation(destinationText);

      if (!results.length) {
        setMapError("No location found. Try another search.");

        return;
      }

      setSuggestions(results);
    } catch (error) {
      console.error("Location search error:", error);

      setMapError("Unable to search location right now.");
    } finally {
      setSearchingLocation(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Select destination
  |--------------------------------------------------------------------------
  */

  const handleSelectDestination = async (location) => {
    try {
      setSearchingLocation(true);

      setMapError("");

      const selectedDestination = [location.latitude, location.longitude];

      setDestination(selectedDestination);

      setDestinationText(location.name);

      setSuggestions([]);

      const calculatedRoute = await getRoute(pickup, selectedDestination);

      setRoute(calculatedRoute);
    } catch (error) {
      console.error("Route calculation error:", error);

      setMapError("Unable to calculate route.");
    } finally {
      setSearchingLocation(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Request ride
  |--------------------------------------------------------------------------
  */

  const handleRequestRide = () => {
    if (!route) {
      return;
    }

    setSearching(true);

    /*
     * Backend ride request integration
     * will be connected here.
     */

    setTimeout(() => {
      setSearching(false);
    }, 1500);
  };

  /*
  |--------------------------------------------------------------------------
  | Fare
  |--------------------------------------------------------------------------
  */

  const estimatedFare = route
    ? Math.max(50, Math.ceil(route.distanceKm * 50))
    : 0;

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-slate-100">
      {/* =====================================================
          MOBILE HEADER
      ====================================================== */}

      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          <Menu size={21} />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-white">
            <MapPin size={16} />
          </div>

          <span className="font-bold">Gontobbo</span>
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
          {user?.name?.charAt(0) || "U"}
        </div>
      </header>

      {/* =====================================================
          MOBILE SIDEBAR OVERLAY
      ====================================================== */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}

        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
              <MapPin size={18} />
            </div>

            <div>
              <p className="font-bold">Gontobbo</p>

              <p className="text-[10px] uppercase tracking-widest text-slate-400">
                Passenger
              </p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        {/* Navigation */}

        <nav className="flex-1 p-4">
          <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Navigation
          </p>

          <button className="flex w-full items-center gap-3 rounded-xl bg-slate-950 px-3 py-3 text-sm font-semibold text-white">
            <Navigation size={18} />
            Book a ride
          </button>

          <button className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100">
            <History size={18} />
            Ride history
          </button>

          <button className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100">
            <User size={18} />
            Profile
          </button>
        </nav>

        {/* User */}

        <div className="border-t border-slate-200 p-4">
          <div className="mb-3 rounded-xl bg-slate-50 p-3">
            <p className="truncate text-sm font-bold">
              {user?.name || "Passenger"}
            </p>

            <p className="mt-0.5 truncate text-xs text-slate-400">
              {user?.email || "Welcome to Gontobbo"}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-500 hover:bg-red-50"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="min-h-screen lg:pl-72">
        {/* Desktop Header */}

        <header className="hidden h-16 items-center justify-between border-b border-slate-200 bg-white px-8 lg:flex">
          <div>
            <p className="text-sm font-bold">
              Good day, {user?.name?.split(" ")[0] || "there"}
            </p>

            <p className="text-xs text-slate-400">
              Where are you heading today?
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
              {user?.name?.charAt(0) || "U"}
            </div>
          </div>
        </header>

        {/* =================================================
            DASHBOARD GRID
        ================================================== */}

        <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[380px_1fr]">
          {/* =================================================
              BOOKING PANEL
          ================================================== */}

          <section className="order-2 border-r border-slate-200 bg-white lg:order-1">
            <div className="p-5 sm:p-6">
              {/* Heading */}

              <div className="mb-7">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Book a ride
                </p>

                <h1 className="mt-2 text-2xl font-bold tracking-tight">
                  Where to?
                </h1>
              </div>

              {/* =================================================
                  LOCATION INPUTS
              ================================================== */}

              <div className="space-y-3">
                {/* Pickup */}

                <div className="relative">
                  <div className="absolute left-4 top-1/2 flex h-2.5 w-2.5 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950" />

                  <input
                    value={pickupText}
                    onChange={(e) => setPickupText(e.target.value)}
                    placeholder="Pickup location"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-slate-950 focus:bg-white"
                  />
                </div>

                {/* Connector */}

                <div className="ml-5 h-5 border-l border-dashed border-slate-300" />

                {/* Destination */}

                <div className="relative">
                  <MapPin
                    size={17}
                    className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={destinationText}
                    onChange={(e) => {
                      setDestinationText(e.target.value);

                      setSuggestions([]);

                      setMapError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearch();
                      }
                    }}
                    placeholder="Where do you want to go?"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-10 pr-11 text-sm font-medium outline-none focus:border-slate-950 focus:bg-white"
                  />

                  <button
                    onClick={handleSearch}
                    disabled={searchingLocation}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-slate-950 text-white disabled:opacity-50"
                  >
                    <Search size={15} />
                  </button>

                  {/* Search Suggestions */}

                  {suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-[1000] mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                      {suggestions.map((location) => (
                        <button
                          key={location.id}
                          onClick={() => handleSelectDestination(location)}
                          className="flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left last:border-0 hover:bg-slate-50"
                        >
                          <MapPin
                            size={17}
                            className="mt-0.5 shrink-0 text-slate-400"
                          />

                          <span className="text-xs leading-5 text-slate-600">
                            {location.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Error */}

              {mapError && (
                <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                  {mapError}
                </div>
              )}

              {/* =================================================
                  ROUTE INFORMATION
              ================================================== */}

              {route && (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-slate-400">Distance</p>

                      <p className="mt-1 font-bold">
                        {route.distanceKm.toFixed(1)} km
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">ETA</p>

                      <p className="mt-1 font-bold">
                        {Math.ceil(route.durationMinutes)} min
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Est. fare</p>

                      <p className="mt-1 font-bold">৳{estimatedFare}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================
                  VEHICLE
              ================================================== */}

              <div className="mt-7">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-bold">Choose a ride</p>

                  <span className="text-xs text-slate-400">
                    Available nearby
                  </span>
                </div>

                <button className="flex w-full items-center gap-4 rounded-2xl border-2 border-slate-950 bg-slate-50 p-4 text-left">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                    <Car size={23} />
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-bold">Gontobbo Car</p>

                    <p className="mt-1 text-xs text-slate-400">
                      Comfortable everyday ride
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold">৳{estimatedFare || "—"}</p>

                    <p className="text-[11px] text-slate-400">estimated</p>
                  </div>
                </button>
              </div>

              {/* =================================================
                  REQUEST RIDE
              ================================================== */}

              <button
                onClick={handleRequestRide}
                disabled={!route || searching}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 py-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {searching ? "Finding nearby drivers..." : "Request ride"}
              </button>

              {!route && (
                <p className="mt-3 text-center text-xs text-slate-400">
                  Enter your destination to request a ride.
                </p>
              )}
            </div>

            {/* =================================================
                RECENT ACTIVITY
            ================================================== */}

            <div className="border-t border-slate-200 p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">Recent activity</p>

                <button className="text-xs font-semibold text-slate-500 hover:text-slate-950">
                  View all
                </button>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <Clock3 size={17} className="text-slate-500" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    No previous rides
                  </p>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Your ride history will appear here.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              MAP
          ================================================== */}

          <section className="order-1 h-[55vh] min-h-[400px] overflow-hidden lg:order-2 lg:h-auto">
            <MapView pickup={pickup} destination={destination} route={route} />
          </section>
        </div>
      </main>
    </div>
  );
}
