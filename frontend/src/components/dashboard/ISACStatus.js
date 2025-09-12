import React from 'react';
import { formatDistanceToNow } from 'date-fns';

const ISACStatus = ({ isacStatus, uavStatus }) => {
  const getISACModeClass = (mode) => {
    switch (mode?.toLowerCase()) {
      case 'good': return 'good';
      case 'medium': return 'medium';
      case 'weak': return 'weak';
      default: return 'weak';
    }
  };

  const getISACModeLabel = (mode) => {
    switch (mode?.toLowerCase()) {
      case 'good': return 'Good Network';
      case 'medium': return 'Medium Network';
      case 'weak': return 'Weak Network';
      default: return 'Unknown';
    }
  };

  const getSignalStrengthColor = (strength) => {
    if (strength >= 75) return '#16a34a';
    if (strength >= 40) return '#d97706';
    return '#dc2626';
  };

  const getDataRateUnit = (dataRate) => {
    if (dataRate >= 1000) {
      return `${(dataRate / 1000).toFixed(1)} Gbps`;
    }
    return `${dataRate?.toFixed(1)} Mbps`;
  };

  const currentMode = isacStatus.mode || uavStatus.isacMode || 'weak';
  const currentSignalStrength = isacStatus.signalStrength ?? uavStatus.signalStrength ?? 0;
  const currentDataRate = isacStatus.dataRate ?? uavStatus.dataRate ?? 0;

  return (
    <div className="card">
      <h2>ISAC Communication Status</h2>
      
      {/* Current ISAC Mode */}
      <div className={`isac-status ${getISACModeClass(currentMode)}`}>
        <div className={`isac-indicator ${getISACModeClass(currentMode)}`}></div>
        <div>
          <div style={{ fontWeight: '600', fontSize: '1rem' }}>
            {getISACModeLabel(currentMode)}
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
            Signal: {currentSignalStrength.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Signal Strength Bar */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Signal Strength</span>
          <span style={{ fontSize: '0.875rem', color: getSignalStrengthColor(currentSignalStrength) }}>
            {currentSignalStrength.toFixed(1)}%
          </span>
        </div>
        <div style={{ 
          width: '100%', 
          height: '8px', 
          backgroundColor: '#e5e7eb', 
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div 
            style={{ 
              width: `${Math.max(0, Math.min(100, currentSignalStrength))}%`,
              height: '100%',
              backgroundColor: getSignalStrengthColor(currentSignalStrength),
              transition: 'width 0.3s ease'
            }}
          />
        </div>
      </div>

      {/* Communication Details */}
      <div className="uav-info">
        <div className="info-item">
          <span className="info-label">Data Rate</span>
          <span className="info-value">{getDataRateUnit(currentDataRate)}</span>
        </div>
        
        <div className="info-item">
          <span className="info-label">Mode</span>
          <span className="info-value">{currentMode?.toUpperCase()}</span>
        </div>
      </div>

      {/* Available Streams */}
      <div style={{ marginTop: '1rem' }}>
        <h3>Available Data Streams</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
          <div className="info-item" style={{ flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem' }}>
              {currentMode === 'good' || currentMode === 'medium' ? '📹' : '❌'}
            </span>
            <span className="info-label">Video</span>
          </div>
          
          <div className="info-item" style={{ flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem' }}>
              {currentMode !== 'unknown' ? '📍' : '❌'}
            </span>
            <span className="info-label">Detections</span>
          </div>
          
          <div className="info-item" style={{ flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem' }}>
              {currentMode === 'good' ? '🧠' : '❌'}
            </span>
            <span className="info-label">AI Updates</span>
          </div>
        </div>
      </div>

      {/* Last Update */}
      {(isacStatus.lastUpdate || uavStatus.lastUpdate) && (
        <div style={{ 
          marginTop: '1rem', 
          fontSize: '0.75rem', 
          color: '#6b7280',
          textAlign: 'center'
        }}>
          Last updated {formatDistanceToNow(new Date(isacStatus.lastUpdate || uavStatus.lastUpdate), { addSuffix: true })}
        </div>
      )}

      {/* ISAC Mode Descriptions */}
      <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#6b7280' }}>
        <div style={{ marginBottom: '0.25rem' }}>
          <strong>Good:</strong> Full HD video + detections + AI updates
        </div>
        <div style={{ marginBottom: '0.25rem' }}>
          <strong>Medium:</strong> Compressed video + detections only
        </div>
        <div>
          <strong>Weak:</strong> Critical survivor coordinates only
        </div>
      </div>
    </div>
  );
};

export default ISACStatus;