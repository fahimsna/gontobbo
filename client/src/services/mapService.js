const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

/*
|--------------------------------------------------------------------------
| Search Location
|--------------------------------------------------------------------------
*/

export async function searchLocation(query) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    q: query,
    format: "json",
    addressdetails: "1",
    limit: "5",
    countrycodes: "bd",
  });

  const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Location search failed");
  }

  const data = await response.json();

  return data.map((place) => ({
    id: place.place_id,

    name: place.display_name,

    latitude: Number(place.lat),

    longitude: Number(place.lon),

    type: place.type,

    address: place.address,
  }));
}

/*
|--------------------------------------------------------------------------
| Reverse Geocoding
|--------------------------------------------------------------------------
*/

export async function reverseGeocode(latitude, longitude) {
  const params = new URLSearchParams({
    lat: latitude,
    lon: longitude,
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
    throw new Error("Unable to find address");
  }

  return response.json();
}

/*
|--------------------------------------------------------------------------
| Calculate Route
|--------------------------------------------------------------------------
*/

export async function calculateRoute(pickup, destination) {
  if (!pickup || !destination) {
    throw new Error("Pickup and destination are required");
  }

  const coordinates = [
    `${pickup.longitude},${pickup.latitude}`,
    `${destination.longitude},${destination.latitude}`,
  ].join(";");

  const url =
    `${OSRM_URL}/${coordinates}` +
    `?overview=full` +
    `&geometries=geojson` +
    `&steps=true`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Unable to calculate route");
  }

  const data = await response.json();

  if (data.code !== "Ok" || !data.routes?.length) {
    throw new Error("No route found");
  }

  const route = data.routes[0];

  return {
    distance: route.distance,

    duration: route.duration,

    geometry: route.geometry,

    legs: route.legs,

    raw: route,
  };
}

/*
|--------------------------------------------------------------------------
| Format Distance
|--------------------------------------------------------------------------
*/

export function formatDistance(meters) {
  if (meters === undefined || meters === null) {
    return "—";
  }

  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
}

/*
|--------------------------------------------------------------------------
| Format Duration
|--------------------------------------------------------------------------
*/

export function formatDuration(seconds) {
  if (seconds === undefined || seconds === null) {
    return "—";
  }

  const minutes = Math.round(seconds / 60);

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);

  const remainingMinutes = minutes % 60;

  if (!remainingMinutes) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

/*
|--------------------------------------------------------------------------
| Fare Estimate
|--------------------------------------------------------------------------
|
| This is currently a frontend estimate.
| We will move the authoritative fare calculation
| to the backend when ride creation is implemented.
|
*/

export function calculateFare(distanceMeters) {
  if (!distanceMeters || distanceMeters <= 0) {
    return 0;
  }

  const distanceKm = distanceMeters / 1000;

  const baseFare = 50;

  const perKm = 20;

  const fare = baseFare + distanceKm * perKm;

  return Math.ceil(fare / 10) * 10;
}
