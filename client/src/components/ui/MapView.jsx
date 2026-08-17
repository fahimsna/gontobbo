import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  GeoJSON,
  useMap,
} from "react-leaflet";

import { useEffect } from "react";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

// Leaflet marker fix for Vite
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DHAKA_CENTER = [23.7806, 90.4258];

/*
|--------------------------------------------------------------------------
| Automatically move map to a location
|--------------------------------------------------------------------------
*/

function MapCenterUpdater({ center }) {
  const map = useMap();

  useEffect(() => {
    if (!center) return;

    map.flyTo(center, 14, {
      duration: 0.8,
    });
  }, [center, map]);

  return null;
}

/*
|--------------------------------------------------------------------------
| Automatically fit the route inside the map
|--------------------------------------------------------------------------
*/

function RouteBounds({ route }) {
  const map = useMap();

  useEffect(() => {
    if (!route?.geometry) return;

    const geoJsonLayer = L.geoJSON(route.geometry);

    const bounds = geoJsonLayer.getBounds();

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [50, 50],
      });
    }
  }, [route, map]);

  return null;
}

/*
|--------------------------------------------------------------------------
| Map
|--------------------------------------------------------------------------
*/

export default function MapView({ pickup, destination, route, drivers = [] }) {
  const center = pickup || DHAKA_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom={true}
      className="h-full w-full"
    >
      {/* OpenStreetMap */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Move to pickup */}
      <MapCenterUpdater center={center} />

      {/* Fit route */}
      <RouteBounds route={route} />

      {/* Pickup */}
      {pickup && (
        <Marker position={pickup}>
          <Popup>
            <div className="text-sm">
              <strong>Pickup</strong>
              <br />
              Your pickup location
            </div>
          </Popup>
        </Marker>
      )}

      {/* Destination */}
      {destination && (
        <Marker position={destination}>
          <Popup>
            <div className="text-sm">
              <strong>Destination</strong>
              <br />
              Your destination
            </div>
          </Popup>
        </Marker>
      )}

      {/* Actual driving route */}
      {route?.geometry && (
        <GeoJSON
          data={route.geometry}
          style={{
            color: "#111827",
            weight: 5,
            opacity: 0.9,
          }}
        />
      )}

      {/* Nearby drivers */}
      {drivers.map((driver) => (
        <Marker key={driver.id} position={[driver.latitude, driver.longitude]}>
          <Popup>
            <div className="text-sm">
              <strong>{driver.name || "Gontobbo Driver"}</strong>

              <br />

              {driver.vehicleType || "Vehicle"}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
