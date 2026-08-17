import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";

import { useEffect } from "react";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icons when using Vite
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

function MapCenterUpdater({ center }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, map.getZoom(), {
      duration: 0.7,
    });
  }, [center, map]);

  return null;
}

export default function MapView({ pickup, destination, drivers = [] }) {
  const center = pickup || DHAKA_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom={true}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapCenterUpdater center={center} />

      {pickup && (
        <Marker position={pickup}>
          <Popup>
            <strong>Pickup location</strong>
          </Popup>
        </Marker>
      )}

      {destination && (
        <Marker position={destination}>
          <Popup>
            <strong>Destination</strong>
          </Popup>
        </Marker>
      )}

      {drivers.map((driver) => (
        <Marker key={driver.id} position={[driver.latitude, driver.longitude]}>
          <Popup>
            <strong>{driver.name || "Gontobbo driver"}</strong>

            <br />

            {driver.vehicleType || "Vehicle"}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
