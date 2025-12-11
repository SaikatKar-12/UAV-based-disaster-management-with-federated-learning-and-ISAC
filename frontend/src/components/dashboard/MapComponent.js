import React, { useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

// Import Leaflet components with error handling
let MapContainer, TileLayer, Marker, Popup;

try {
  const leaflet = require('react-leaflet');
  ({ MapContainer, TileLayer, Marker, Popup } = leaflet);
  // Re-import L to ensure it's available
  L = require('leaflet');
  require('leaflet/dist/leaflet.css');
} catch (error) {
  console.warn('Leaflet not available, using fallback map component');
  // Provide fallback components in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Leaflet error:', error);
  }
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

// Custom UAV icon
const createUAVIcon = (status = 'idle', isSelected = false) => {
  const color = {
    idle: '#6b7280',
    connected: '#3b82f6',
    moving: '#10b981',
    landing: '#f59e0b',
    emergency: '#ef4444',
    disconnected: '#9ca3af'
  }[status] || '#6b7280';

  return L.divIcon({
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: ${color};
        border: 2px solid ${isSelected ? '#ff0' : '#fff'};
        border-radius: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        box-shadow: 0 0 10px rgba(0,0,0,0.3);
      ">
        <div style="
          width: 12px;
          height: 12px;
          background: ${status === 'connected' || status === 'moving' ? '#10b981' : '#ef4444'};
          border-radius: 50%;
          border: 2px solid white;
        "></div>
      </div>
    `,
    className: 'uav-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

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

const UAVMarkers = ({ uavs, selectedUAV, onUAVClick }) => {
  return Object.entries(uavs).map(([id, uav]) => (
    <Marker
      key={id}
      position={[uav.location?.lat || 0, uav.location?.lng || 0]}
      icon={createUAVIcon(uav.status, selectedUAV === id)}
      eventHandlers={{
        click: () => onUAVClick && onUAVClick(id)
      }}
    >
      <Popup>
        <div>
          <h4>UAV {id}</h4>
          <p>Status: {uav.status || 'unknown'}</p>
          <p>Battery: {uav.batteryLevel?.toFixed(1) || 'N/A'}%</p>
          <p>
            Position: {uav.location?.lat?.toFixed(4) || 'N/A'}, {uav.location?.lng?.toFixed(4) || 'N/A'}
          </p>
          <p>Altitude: {uav.location?.altitude?.toFixed(1) || '0'}m</p>
        </div>
      </Popup>
    </Marker>
  ));
};

const MapComponent = ({ survivors, uavStatus, uavs, onSurvivorClick, onUAVSelect }) => {
  // Move all hooks to the top, before any conditional returns
  const defaultCenter = useMemo(() => [22.5726, 88.3639], []);
  const baseStationLocation = useMemo(() => [22.5726, 88.3639], []);

  // If Leaflet components are not available, use fallback
  if (!MapContainer || !TileLayer || !Marker || !Popup || !L) {
    return <MapFallback survivors={survivors} uavStatus={uavStatus} />;
  }

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

  const handleUAVClick = (uavId) => {
    if (onUAVSelect) {
      onUAVSelect(uavId);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <MapContainer
        center={defaultCenter}
        zoom={15}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

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
        <UAVMarkers 
          uavs={uavs} 
          selectedUAV={uavStatus?.uavId}
          onUAVClick={handleUAVClick} 
        />

        {/* Map updater component - Disabled for multi-UAV to prevent unnecessary movements */}
        {/* <MapUpdater uavStatus={uavStatus} /> */}

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
    </div>
  );
};

export default MapComponent;