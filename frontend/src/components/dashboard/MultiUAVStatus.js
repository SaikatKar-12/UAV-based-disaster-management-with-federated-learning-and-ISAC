import React from 'react';
import { formatDistanceToNow } from 'date-fns';

const MultiUAVStatus = ({ uavs, loading }) => {
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

  const getISACColor = (mode) => {
    if (mode === 'good') return '#16a34a';
    if (mode === 'medium') return '#d97706';
    return '#dc2626';
  };

  const getISACIcon = (mode) => {
    if (mode === 'good') return '🟢';
    if (mode === 'medium') return '🟡';
    return '🔴';
  };

  const formatCoordinate = (coord) => {
    return coord?.toFixed(4) || 'N/A';
  };

  if (loading) {
    return (
      <div className="card">
        <h2>UAV Fleet Status</h2>
        <div className="loading">
          <div className="spinner"></div>
          Loading UAV status...
        </div>
      </div>
    );
  }

  if (!uavs || uavs.length === 0) {
    return (
      <div className="card">
        <h2>UAV Fleet Status</h2>
        <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
          No UAVs available
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>UAV Fleet Status ({uavs.length} UAVs)</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {uavs.map((uav) => (
          <div 
            key={uav.uavId} 
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '1rem',
              backgroundColor: '#f9fafb'
            }}
          >
            {/* UAV Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '0.75rem'
            }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                {uav.uavId}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem' }}>
                  {getISACIcon(uav.isacMode)} {uav.isacMode?.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Battery Status */}
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '0.25rem' 
              }}>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Battery</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '500',
                    color: getBatteryColor(uav.batteryLevel) 
                  }}>
                    {uav.batteryLevel?.toFixed(1)}%
                  </span>
                  <div style={{
                    width: '40px',
                    height: '8px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div 
                      style={{
                        width: `${Math.max(0, Math.min(100, uav.batteryLevel))}%`,
                        height: '100%',
                        backgroundColor: getBatteryColor(uav.batteryLevel),
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Key Stats Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '0.5rem',
              marginBottom: '0.75rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Signal</div>
                <div style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '500',
                  color: getISACColor(uav.isacMode)
                }}>
                  {uav.signalStrength?.toFixed(1)}%
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Data Rate</div>
                <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                  {uav.dataRate?.toFixed(1)} Mbps
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Altitude</div>
                <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                  {uav.location?.altitude?.toFixed(1)}m
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Status</div>
                <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                  {uav.status?.toUpperCase() || 'ACTIVE'}
                </div>
              </div>
            </div>

            {/* Location */}
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#6b7280',
              textAlign: 'center'
            }}>
              📍 {formatCoordinate(uav.location?.lat)}, {formatCoordinate(uav.location?.lng)}
            </div>

            {/* Warning for low battery */}
            {uav.batteryLevel < 20 && (
              <div style={{ 
                marginTop: '0.5rem',
                padding: '0.5rem', 
                backgroundColor: '#fee2e2', 
                color: '#b91c1c', 
                borderRadius: '4px',
                fontSize: '0.75rem',
                textAlign: 'center'
              }}>
                ⚠️ Low Battery - Return to Base
              </div>
            )}

            {/* Warning for weak signal */}
            {uav.isacMode === 'weak' && (
              <div style={{ 
                marginTop: '0.5rem',
                padding: '0.5rem', 
                backgroundColor: '#fef3c7', 
                color: '#92400e', 
                borderRadius: '4px',
                fontSize: '0.75rem',
                textAlign: 'center'
              }}>
                📡 Weak Signal - Limited Communication
              </div>
            )}

            {/* Last Update */}
            {uav.lastUpdate && (
              <div style={{ 
                marginTop: '0.5rem',
                fontSize: '0.625rem', 
                color: '#9ca3af',
                textAlign: 'center'
              }}>
                Updated {formatDistanceToNow(new Date(uav.lastUpdate), { addSuffix: true })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Fleet Summary */}
      <div style={{ 
        marginTop: '1rem',
        padding: '0.75rem',
        backgroundColor: '#f3f4f6',
        borderRadius: '6px'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '0.5rem',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Good Signal</div>
            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#16a34a' }}>
              {uavs.filter(uav => uav.isacMode === 'good').length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Medium Signal</div>
            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#d97706' }}>
              {uavs.filter(uav => uav.isacMode === 'medium').length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Weak Signal</div>
            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#dc2626' }}>
              {uavs.filter(uav => uav.isacMode === 'weak').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MultiUAVStatus);