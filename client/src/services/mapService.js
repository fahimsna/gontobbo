const NOMINATIM_URL = "https://nominatim.openstreetmap.org";

const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

/*
|--------------------------------------------------------------------------
| SEARCH LOCATION
|--------------------------------------------------------------------------
*/

export async function searchLocation(query) {
  const trimmedQuery = String(query || "").trim();

  if (trimmedQuery.length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    q: trimmedQuery,
    format: "json",
    addressdetails: "1",
    limit: "5",
    countrycodes: "bd",
  });

  const response = await fetch(`${NOMINATIM_URL}/search?${params.toString()}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Location search failed: ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((place) => {
      const latitude = Number(place.lat);
      const longitude = Number(place.lon);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }

      return {
        id: place.place_id,

        name:
          place.name ||
          getShortAddressName(place.address) ||
          place.display_name,

        displayName: place.display_name,

        latitude,

        longitude,

        type: place.type,

        address: place.address || {},
      };
    })
    .filter(Boolean);
}

/*
|--------------------------------------------------------------------------
| REVERSE GEOCODING
|--------------------------------------------------------------------------
*/

export async function reverseGeocode(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Invalid coordinates.");
  }

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "json",
    addressdetails: "1",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Reverse geocoding failed.");
  }

  const data = await response.json();

  return {
    id: data.place_id,

    name: data.name || getShortAddressName(data.address) || data.display_name,

    displayName: data.display_name || "",

    latitude: Number(data.lat),

    longitude: Number(data.lon),

    address: data.address || {},
  };
}

/*
|--------------------------------------------------------------------------
| CALCULATE ROUTE
|--------------------------------------------------------------------------
|
| Nominatim uses:
|
| latitude
| longitude
|
| OSRM requires:
|
| longitude,latitude
|--------------------------------------------------------------------------
*/

export async function calculateRoute(pickup, destination) {
  if (!pickup || !destination) {
    throw new Error("Pickup and destination are required.");
  }

  const pickupLatitude = Number(pickup.latitude);

  const pickupLongitude = Number(pickup.longitude);

  const destinationLatitude = Number(destination.latitude);

  const destinationLongitude = Number(destination.longitude);

  if (
    !Number.isFinite(pickupLatitude) ||
    !Number.isFinite(pickupLongitude) ||
    !Number.isFinite(destinationLatitude) ||
    !Number.isFinite(destinationLongitude)
  ) {
    throw new Error("Invalid pickup or destination coordinates.");
  }

  /*
  |--------------------------------------------------------------------------
  | Bangladesh coordinate validation
  |--------------------------------------------------------------------------
  */

  if (
    !isBangladeshCoordinate(pickupLatitude, pickupLongitude) ||
    !isBangladeshCoordinate(destinationLatitude, destinationLongitude)
  ) {
    throw new Error("Invalid Bangladesh coordinates.");
  }

  /*
  |--------------------------------------------------------------------------
  | IMPORTANT
  |--------------------------------------------------------------------------
  |
  | OSRM = longitude,latitude
  |--------------------------------------------------------------------------
  */

  const coordinates =
    `${pickupLongitude},${pickupLatitude};` +
    `${destinationLongitude},${destinationLatitude}`;

  const url =
    `${OSRM_URL}/${coordinates}` +
    "?overview=full" +
    "&geometries=geojson" +
    "&steps=true";

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Route calculation failed: ${response.status}`);
  }

  const data = await response.json();

  if (
    data.code !== "Ok" ||
    !Array.isArray(data.routes) ||
    data.routes.length === 0
  ) {
    throw new Error("No driving route found.");
  }

  const route = data.routes[0];

  /*
  |--------------------------------------------------------------------------
  | OSRM returns:
  |
  | distance = meters
  | duration = seconds
  |--------------------------------------------------------------------------
  */

  const distanceMeters = Number(route.distance);

  const durationSeconds = Number(route.duration);

  if (!Number.isFinite(distanceMeters) || !Number.isFinite(durationSeconds)) {
    throw new Error(
      "Invalid distance or duration returned by routing service.",
    );
  }

  const distanceKm = distanceMeters / 1000;

  const durationMinutes = durationSeconds / 60;

  /*
  |--------------------------------------------------------------------------
  | Safety check
  |--------------------------------------------------------------------------
  */

  if (distanceKm <= 0 || distanceKm > 200) {
    throw new Error(`Invalid route distance: ${distanceKm.toFixed(2)} km`);
  }

  /*
  |--------------------------------------------------------------------------
  | Return BOTH raw OSRM values and converted
  | values.
  |--------------------------------------------------------------------------
  */

  return {
    /*
    | Existing MapView / dashboard compatibility
    */

    distance: distanceMeters,

    duration: durationSeconds,

    /*
    | Convenient converted values
    */

    distanceKm: Number(distanceKm.toFixed(2)),

    durationMinutes: Number(durationMinutes.toFixed(1)),

    /*
    | Leaflet GeoJSON route
    */

    geometry: route.geometry,

    /*
    | OSRM legs
    */

    legs: route.legs || [],

    /*
    | Original response
    */

    raw: route,
  };
}

/*
|--------------------------------------------------------------------------
| BUILD RIDE LOCATION
|--------------------------------------------------------------------------
|
| THIS IS THE FUNCTION YOUR
| PassengerDashboard.jsx IMPORTS.
|
| Backend expects:
|
| {
|   latitude,
|   longitude,
|   address: "string"
| }
|
| We deliberately make address a STRING.
|
|--------------------------------------------------------------------------
*/

export function buildRideLocation(location) {
  if (!location) {
    return null;
  }

  const latitude = Number(location.latitude);

  const longitude = Number(location.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Invalid location coordinates.");
  }

  /*
  |--------------------------------------------------------------------------
  | Convert Nominatim address object into
  | a normal string.
  |--------------------------------------------------------------------------
  */

  let address = "";

  if (typeof location.address === "string") {
    address = location.address;
  } else if (location.displayName) {
    address = location.displayName;
  } else {
    address = buildAddressString(location.address);
  }

  return {
    latitude,

    longitude,

    /*
    | Backend should receive STRING
    | instead of Nominatim object.
    */

    address: address || "Selected location",
  };
}

/*
|--------------------------------------------------------------------------
| BUILD ADDRESS STRING
|--------------------------------------------------------------------------
*/

export function buildAddressString(address) {
  if (!address) {
    return "";
  }

  if (typeof address === "string") {
    return address;
  }

  const parts = [
    address.road,

    address.house_number,

    address.neighbourhood,

    address.suburb,

    address.city_district,

    address.city,

    address.town,

    address.village,

    address.state_district,

    address.state,

    address.postcode,

    address.country,
  ];

  /*
  |--------------------------------------------------------------------------
  | Remove duplicates and empty values
  |--------------------------------------------------------------------------
  */

  return [...new Set(parts.filter(Boolean))].join(", ");
}

/*
|--------------------------------------------------------------------------
| FORMAT DISTANCE
|--------------------------------------------------------------------------
|
| Accepts METERS.
|--------------------------------------------------------------------------
*/

export function formatDistance(meters) {
  const value = Number(meters);

  if (!Number.isFinite(value) || value < 0) {
    return "—";
  }

  if (value < 1000) {
    return `${Math.round(value)} m`;
  }

  return `${(value / 1000).toFixed(1)} km`;
}

/*
|--------------------------------------------------------------------------
| FORMAT DURATION
|--------------------------------------------------------------------------
|
| Accepts SECONDS.
|--------------------------------------------------------------------------
*/

export function formatDuration(seconds) {
  const value = Number(seconds);

  if (!Number.isFinite(value) || value < 0) {
    return "—";
  }

  const minutes = Math.round(value / 60);

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);

  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

/*
|--------------------------------------------------------------------------
| CALCULATE FARE
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| PassengerDashboard passes route.distanceKm
| to this function.
|
| Therefore this function expects KILOMETRES.
|--------------------------------------------------------------------------
*/

export function calculateFare(distanceKm) {
  const distance = Number(distanceKm);

  if (!Number.isFinite(distance) || distance <= 0) {
    return 0;
  }

  /*
  |--------------------------------------------------------------------------
  | Gontobbo fare model
  |--------------------------------------------------------------------------
  */

  const BASE_FARE = 50;

  const PER_KM = 20;

  const fare = BASE_FARE + distance * PER_KM;

  /*
  |--------------------------------------------------------------------------
  | Round fare to nearest 10
  |--------------------------------------------------------------------------
  */

  return Math.ceil(fare / 10) * 10;
}

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function isBangladeshCoordinate(latitude, longitude) {
  return latitude >= 20 && latitude <= 27 && longitude >= 88 && longitude <= 93;
}

function getShortAddressName(address) {
  if (!address) {
    return "";
  }

  return (
    address.suburb ||
    address.neighbourhood ||
    address.city_district ||
    address.city ||
    address.town ||
    address.village ||
    ""
  );
}

/*
|--------------------------------------------------------------------------
| OPTIONAL ALIASES
|--------------------------------------------------------------------------
|
| Keep these in case another component in your
| project imports these names.
|--------------------------------------------------------------------------
*/

export const geocode = searchLocation;

export const getRoute = calculateRoute;
