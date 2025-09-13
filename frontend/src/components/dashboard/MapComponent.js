import React, { useEffect, useRef } from 'react';

// Fallback component if Leaflet fails to load
const MapFallback = ({ survivors, uavStatus }) => (
  <div style={{
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    padding: '2rem'
  }}>
    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗺️</div>
    <h3>Map View</h3>
    <p>UAV Position: {uavStatus?.location?.lat?.toFixed(4)}, {uavStatus?.location?.lng?.toFixed(4)}</p>
    <p>Survivors Detected: {survivors?.length || 0}</p>
    <p style={{ fontSize: '0.875rem', marginTop: '1rem', textAlign: 'center' }}>
      Interactive map will load when all dependencies are available
    </p>
  </div>
);

// Try to import Leaflet components with error handling
let MapContainer, TileLayer, Marker, Popup, useMap, L;

try {
  const leaflet = require('react-leaflet');
  MapContainer = leaflet.MapContainer;
  TileLayer = leaflet.TileLayer;
  Marker = leaflet.Marker;
  Popup = leaflet.Popup;
  useMap = leaflet.useMap;
  L = require('leaflet');
  require('leaflet/dist/leaflet.css');
} catch (error) {
  console.warn('Leaflet not available, using fallback map component');
}

// Fix for default markers in react-leaflet (only if L is available)
if (L && L.Icon && L.Icon.Default) {
  try {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
      iconUrl: require('leaflet/dist/images/marker-icon.png'),
      shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
    });
  } catch (error) {
    console.warn('Could not configure Leaflet icons:', error);
  }
}

// Custom marker icons (only if L is available)
const createCustomIcon = (color, size = [20, 20]) => {
  if (!L) return null;
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: ${size[0]}px;
      height: ${size[1]}px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1] / 2]
  });
};

const createUAVIcon = (isacMode) => {
  if (!L) return null;
  
  let color = '#3b82f6'; // Default blue
  if (isacMode === 'good') color = '#16a34a'; // Green
  else if (isacMode === 'medium') color = '#d97706'; // Orange
  else if (isacMode === 'weak') color = '#dc2626'; // Red
  
  return L.divIcon({
    className: 'uav-marker',
    html: `<div style="
      background-color: ${color};
      width: 16px;
      height: 16px;
      border: 2px solid white;
      transform: rotate(45deg);
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

const createBaseStationIcon = () => {
  if (!L) return null;
  return L.divIcon({
    className: 'base-station-marker',
    html: `<div style="
      background-color: #8b5cf6;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
};

// Component to update map view when UAV moves
const MapUpdater = ({ uavStatus }) => {
  const map = useMap();
  const prevLocationRef = useRef();

  useEffect(() => {
    if (uavStatus.location && uavStatus.location.lat && uavStatus.location.lng) {
      const { lat, lng } = uavStatus.location;
      const prevLocation = prevLocationRef.current;

      // Only update if location changed significantly (to avoid constant panning)
      if (!prevLocation ||
        Math.abs(prevLocation.lat - lat) > 0.001 ||
        Math.abs(prevLocation.lng - lng) > 0.001) {

        map.setView([lat, lng], map.getZoom(), { animate: true });
        prevLocationRef.current = { lat, lng };
      }
    }
  }, [uavStatus.location, map]);

  return null;
};

const MapComponent = ({ survivors, uavStatus, uavs, onSurvivorClick }) => {
  // If Leaflet components are not available, use fallback
  if (!MapContainer || !TileLayer || !Marker || !Popup || !L) {
    return <MapFallback survivors={survivors} uavStatus={uavStatus} />;
  }

  // Default center (Kolkata, India) - Fixed center for multi-UAV view
  const defaultCenter = [22.5726, 88.3639];
  const mapCenter = defaultCenter; // Always use fixed center to avoid unnecessary movements

  // Base station location (origin)
  const baseStationLocation = [22.5726, 88.3639];

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return '#16a34a'; // Green for high confidence
    if (confidence >= 0.6) return '#d97706'; // Orange for medium confidence
    return '#dc2626'; // Red for low confidence
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const getSurvivorIcon = (survivor) => {
    const color = survivor.status === 'rescued' ? '#22c55e' : getConfidenceColor(survivor.confidence);
    const size = survivor.confidence >= 0.8 ? [24, 24] : [20, 20];
    return createCustomIcon(color, size);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <MapContainer
      center={mapCenter}
      zoom={15}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Map updater component - Disabled for multi-UAV to prevent unnecessary movements */}
      {/* <MapUpdater uavStatus={uavStatus} /> */}

      {/* Base Station Marker */}
      <Marker
        position={baseStationLocation}
        icon={createBaseStationIcon()}
      >
        <Popup>
          <div>
            <div className="popup-title">Base Station</div>
            <div className="popup-info">Communication Hub</div>
            <div className="popup-info">Coordinates: {baseStationLocation[0].toFixed(4)}, {baseStationLocation[1].toFixed(4)}</div>
          </div>
        </Popup>
      </Marker>

      {/* UAV Markers - Multiple UAVs */}
      {uavs && uavs.map((uav) => (
        uav.location && uav.location.lat && (
          <Marker 
            key={uav.uavId}
            position={[uav.location.lat, uav.location.lng]} 
            icon={createUAVIcon(uav.isacMode)}
          >
            <Popup>
              <div>
                <div className="popup-title">{uav.uavId}</div>
                <div className="popup-info">Altitude: {uav.location.altitude}m</div>
                <div className="popup-info">Battery: {uav.batteryLevel?.toFixed(1)}%</div>
                <div className="popup-info">ISAC Mode: {uav.isacMode?.toUpperCase()}</div>
                <div className="popup-info">Signal: {uav.signalStrength?.toFixed(1)}%</div>
                <div className="popup-info">Data Rate: {uav.dataRate?.toFixed(1)} Mbps</div>
                <div className="popup-info">Status: {uav.status?.toUpperCase()}</div>
                {uav.lastUpdate && (
                  <div className="popup-info">Last Update: {formatTimestamp(uav.lastUpdate)}</div>
                )}
              </div>
            </Popup>
          </Marker>
        )
      ))}

      {/* Backward compatibility - Single UAV Marker */}
      {(!uavs || uavs.length === 0) && uavStatus.location && uavStatus.location.lat && (
        <Marker
          position={[uavStatus.location.lat, uavStatus.location.lng]}
          icon={createUAVIcon(uavStatus.isacMode)}
        >
          <Popup>
            <div>
              <div className="popup-title">{uavStatus.uavId}</div>
              <div className="popup-info">Altitude: {uavStatus.location.altitude}m</div>
              <div className="popup-info">Battery: {uavStatus.batteryLevel?.toFixed(1)}%</div>
              <div className="popup-info">ISAC Mode: {uavStatus.isacMode?.toUpperCase()}</div>
              <div className="popup-info">Signal: {uavStatus.signalStrength?.toFixed(1)}%</div>
              {uavStatus.lastUpdate && (
                <div className="popup-info">Last Update: {formatTimestamp(uavStatus.lastUpdate)}</div>
              )}
            </div>
          </Popup>
        </Marker>
      )}

      {/* Survivor Markers */}
      {survivors.map((survivor) => (
        <Marker
          key={survivor.id}
          position={[survivor.coordinates.lat, survivor.coordinates.lng]}
          icon={getSurvivorIcon(survivor)}
          eventHandlers={{
            click: () => onSurvivorClick && onSurvivorClick(survivor)
          }}
        >
          <Popup>
            <div>
              <div className="popup-title">
                {survivor.status === 'rescued' ? '✅ Rescued Survivor' : '🆘 Survivor Detected'}
              </div>
              <div className="popup-info">ID: {survivor.id}</div>
              <div className="popup-info">
                Coordinates: {survivor.coordinates.lat.toFixed(4)}, {survivor.coordinates.lng.toFixed(4)}
              </div>
              <div className="popup-info">
                Confidence:
                <span className={`popup-confidence ${getConfidenceLabel(survivor.confidence).toLowerCase()}`}>
                  {(survivor.confidence * 100).toFixed(1)}% ({getConfidenceLabel(survivor.confidence)})
                </span>
              </div>
              <div className="popup-info">Detected by: {survivor.uavId}</div>
              <div className="popup-info">Time: {formatTimestamp(survivor.timestamp)}</div>
              {survivor.additionalInfo && (
                <div className="popup-info">Info: {survivor.additionalInfo}</div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapComponent;