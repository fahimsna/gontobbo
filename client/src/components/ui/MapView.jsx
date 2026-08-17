import { useEffect, useRef } from "react";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

/*
|--------------------------------------------------------------------------
| Fix Leaflet marker icons
|--------------------------------------------------------------------------
*/

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,

  iconUrl: markerIcon,

  shadowUrl: markerShadow,
});

/*
|--------------------------------------------------------------------------
| MapView
|--------------------------------------------------------------------------
*/

export default function MapView({
  pickup = null,
  destination = null,
  route = null,
  onMapClick,
}) {
  const mapContainerRef = useRef(null);

  const mapRef = useRef(null);

  const pickupMarkerRef = useRef(null);

  const destinationMarkerRef = useRef(null);

  const routeLayerRef = useRef(null);

  /*
  |--------------------------------------------------------------------------
  | Create map
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(mapContainerRef.current, {
      center: [23.8103, 90.4125],

      zoom: 12,

      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',

      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    /*
    |--------------------------------------------------------------------------
    | Map click
    |--------------------------------------------------------------------------
    */

    if (onMapClick) {
      map.on("click", (event) => {
        onMapClick({
          latitude: event.latlng.lat,

          longitude: event.latlng.lng,
        });
      });
    }

    return () => {
      map.remove();

      mapRef.current = null;
    };
  }, [onMapClick]);

  /*
  |--------------------------------------------------------------------------
  | Pickup marker
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    if (pickupMarkerRef.current) {
      map.removeLayer(pickupMarkerRef.current);

      pickupMarkerRef.current = null;
    }

    if (!pickup) {
      return;
    }

    const marker = L.marker([pickup.latitude, pickup.longitude])
      .addTo(map)
      .bindPopup("<strong>Pickup</strong>");

    pickupMarkerRef.current = marker;
  }, [pickup]);

  /*
  |--------------------------------------------------------------------------
  | Destination marker
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    if (destinationMarkerRef.current) {
      map.removeLayer(destinationMarkerRef.current);

      destinationMarkerRef.current = null;
    }

    if (!destination) {
      return;
    }

    const marker = L.marker([destination.latitude, destination.longitude])
      .addTo(map)
      .bindPopup("<strong>Destination</strong>");

    destinationMarkerRef.current = marker;
  }, [destination]);

  /*
  |--------------------------------------------------------------------------
  | Route
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);

      routeLayerRef.current = null;
    }

    if (!route?.geometry) {
      return;
    }

    const layer = L.geoJSON(route.geometry, {
      style: {
        weight: 5,

        opacity: 0.9,
      },
    }).addTo(map);

    routeLayerRef.current = layer;

    const bounds = layer.getBounds();

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [50, 50],
      });
    }
  }, [route]);

  /*
  |--------------------------------------------------------------------------
  | Fit markers when no route
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const map = mapRef.current;

    if (!map || route) {
      return;
    }

    const points = [];

    if (pickup) {
      points.push([pickup.latitude, pickup.longitude]);
    }

    if (destination) {
      points.push([destination.latitude, destination.longitude]);
    }

    if (points.length === 1) {
      map.setView(points[0], 15);
    }

    if (points.length === 2) {
      map.fitBounds(L.latLngBounds(points), {
        padding: [50, 50],
      });
    }
  }, [pickup, destination, route]);

  return <div ref={mapContainerRef} className="h-full min-h-[350px] w-full" />;
}
