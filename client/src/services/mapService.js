const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

/**
 * Search an address using OpenStreetMap Nominatim.
 */
export async function searchLocation(query) {
  if (!query?.trim()) {
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
    throw new Error("Unable to search location");
  }

  const data = await response.json();

  return data.map((item) => ({
    id: item.place_id,
    name: item.display_name,
    latitude: Number(item.lat),
    longitude: Number(item.lon),
  }));
}

/**
 * Calculate driving route using OSRM.
 */
export async function getRoute(pickup, destination) {
  if (!pickup || !destination) {
    return null;
  }

  const coordinates = [
    `${pickup[1]},${pickup[0]}`,
    `${destination[1]},${destination[0]}`,
  ].join(";");

  const params = new URLSearchParams({
    overview: "full",
    geometries: "geojson",
    steps: "true",
  });

  const response = await fetch(
    `${OSRM_URL}/${coordinates}?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error("Unable to calculate route");
  }

  const data = await response.json();

  if (data.code !== "Ok" || !data.routes?.length) {
    throw new Error("No route found");
  }

  const route = data.routes[0];

  return {
    distanceKm: route.distance / 1000,

    durationMinutes: route.duration / 60,

    geometry: route.geometry,
  };
}
