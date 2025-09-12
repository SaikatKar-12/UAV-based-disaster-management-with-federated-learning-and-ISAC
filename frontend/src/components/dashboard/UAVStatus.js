import React from 'react';
import { formatDistanceToNow } from 'date-fns';

const UAVStatus = ({ uavStatus, loading }) => {
  const getBatteryClass = (level) => {
    if (level >= 60) return 'high';
    if (level >= 30) return 'medium';
    return 'low';
  };

  const getBatteryColor = (level) => {
    if (level >= 60) return '#16a34a';
    if (level >= 30) return '#d97706';
    return '#dc2626';
  };

  const formatCoordinate = (coord) => {
    return coord?.toFixed(4) || 'N/A';
  };

  if (loading) {
    return (
      <div className="card">
        <h2>UAV Status</h2>
        <div className="loading">
          <div className="spinner"></div>
          Loading UAV status...
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>UAV Status - {uavStatus.uavId}</h2>
      
      {/* Battery Status */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Battery Level</span>
          <div className="battery-indicator">
            <span style={{ fontSize: '0.875rem', color: getBatteryColor(uavStatus.batteryLevel) }}>
              {uavStatus.batteryLevel?.toFixed(1)}%
            </span>
            <div className="battery-bar">
              <div 
                className={`battery-fill ${getBatteryClass(uavStatus.batteryLevel)}`}
                style={{ width: `${Math.max(0, Math.min(100, uavStatus.batteryLevel))}%` }}
              />
            </div>
          </div>
        </div>
        
        {uavStatus.batteryLevel < 20 && (
          <div style={{ 
            padding: '0.5rem', 
            backgroundColor: '#fee2e2', 
            color: '#b91c1c', 
            borderRadius: '4px',
            fontSize: '0.75rem',
            textAlign: 'center'
          }}>
            ⚠️ Low Battery - Return to Base Recommended
          </div>
        )}
      </div>

      {/* Location Information */}
      <div className="uav-info">
        <div className="info-item">
          <span className="info-label">Latitude</span>
          <span className="info-value">{formatCoordinate(uavStatus.location?.lat)}</span>
        </div>
        
        <div className="info-item">
          <span className="info-label">Longitude</span>
          <span className="info-value">{formatCoordinate(uavStatus.location?.lng)}</span>
        </div>
        
        <div className="info-item">
          <span className="info-label">Altitude</span>
          <span className="info-value">{uavStatus.location?.altitude?.toFixed(1)}m</span>
        </div>
        
        <div className="info-item">
          <span className="info-label">ISAC Mode</span>
          <span className="info-value">{uavStatus.isacMode?.toUpperCase() || 'N/A'}</span>
        </div>
      </div>

      {/* System Status */}
      <div style={{ marginTop: '1rem' }}>
        <h3>System Status</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <div className="info-item" style={{ flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem' }}>
              {uavStatus.cameraActive !== false ? '📷' : '❌'}
            </span>
            <span className="info-label">Camera</span>
            <span className="info-value" style={{ fontSize: '0.75rem' }}>
              {uavStatus.cameraActive !== false ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div className="info-item" style={{ flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem' }}>
              {uavStatus.signalStrength > 0 ? '📡' : '❌'}
            </span>
            <span className="info-label">Signal</span>
            <span className="info-value" style={{ fontSize: '0.75rem' }}>
              {uavStatus.signalStrength?.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* AI Model Information */}
      {uavStatus.aiModelVersion && (
        <div style={{ marginTop: '1rem' }}>
          <div className="info-item">
            <span className="info-label">AI Model Version</span>
            <span className="info-value">{uavStatus.aiModelVersion}</span>
          </div>
        </div>
      )}

      {/* Flight Status Indicators */}
      <div style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>
              {uavStatus.batteryLevel > 20 ? '✈️' : '🔋'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {uavStatus.batteryLevel > 20 ? 'Flying' : 'Low Power'}
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>
              {uavStatus.isacMode === 'good' ? '🟢' : 
               uavStatus.isacMode === 'medium' ? '🟡' : '🔴'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              Communication
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>
              {uavStatus.cameraActive !== false ? '👁️' : '❌'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              Detection
            </div>
          </div>
        </div>
      </div>

      {/* Last Update */}
      {uavStatus.lastUpdate && (
        <div style={{ 
          marginTop: '1rem', 
          fontSize: '0.75rem', 
          color: '#6b7280',
          textAlign: 'center'
        }}>
          Last updated {formatDistanceToNow(new Date(uavStatus.lastUpdate), { addSuffix: true })}
        </div>
      )}
    </div>
  );
};

export default React.memo(UAVStatus);