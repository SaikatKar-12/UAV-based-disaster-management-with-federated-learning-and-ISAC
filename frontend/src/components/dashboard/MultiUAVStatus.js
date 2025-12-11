import React, { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const MultiUAVStatus = ({ uavs: uavsProp, loading: initialLoading = false }) => {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  
  // Auto-refresh data every 5 seconds
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (!isRefreshing) {
        setIsRefreshing(true);
        setLastUpdated(new Date());
        setIsRefreshing(false);
      }
    }, 5000);

    return () => clearInterval(refreshInterval);
  }, [isRefreshing]);

  // Convert uavs object to array if needed and normalize data
  const uavs = React.useMemo(() => {
    const uavsArray = Array.isArray(uavsProp) ? uavsProp : Object.values(uavsProp || {});
    return uavsArray.map(uav => ({
      ...uav,
      // Ensure consistent field names
      uavId: uav.uavId || uav.id,
      battery: uav.battery || uav.batteryLevel || 0,
      position: Array.isArray(uav.position) ? uav.position : [0, 0, 0],
      // Add default values for required fields
      status: uav.status || 'disconnected',
      signalStrength: uav.signalStrength ?? 0,
      dataRate: uav.dataRate ?? 0,
      isacMode: uav.isacMode || 'weak',
      // Handle position data
      location: {
        lat: Array.isArray(uav.position) ? uav.position[0] : 0,
        lng: Array.isArray(uav.position) ? uav.position[1] : 0,
        alt: Array.isArray(uav.position) ? uav.position[2] : 0
      },
      // Add last update timestamp
      lastUpdate: uav.lastUpdate || new Date().toISOString(),
      // Set connected status
      connected: uav.connected !== false && uav.status !== 'disconnected'
    }));
  }, [uavsProp]);

  const getBatteryClass = (level) => {
    const batteryLevel = Number(level) || 0;
    if (batteryLevel >= 60) return 'high';
    if (batteryLevel >= 30) return 'medium';
    return 'low';
  };

  const getBatteryColor = (level) => {
    if (level >= 60) return '#16a34a';
    if (level >= 30) return '#d97706';
    return '#dc2626';
  };

  const getISACColor = (mode) => {
    const modeMap = {
      good: '#16a34a',
      medium: '#d97706',
      weak: '#dc2626'
    };
    return modeMap[mode?.toLowerCase()] || '#6b7280';
  };

  const getStatusColor = (status) => {
    const statusMap = {
      connected: '#16a34a',
      disconnected: '#dc2626',
      landing: '#d97706',
      taking_off: '#d97706',
      error: '#dc2626',
      ready: '#16a34a'
    };
    return statusMap[status?.toLowerCase()] || '#6b7280';
  };

  const formatCoordinate = (coord) => {
    if (Array.isArray(coord)) {
      return coord.map(c => (typeof c === 'number' ? c.toFixed(4) : c)).join(', ');
    }
    return coord?.toFixed?.(4) || 'N/A';
  };

  const isLoading = initialLoading || isRefreshing;
  
  // Calculate fleet stats
  const fleetStats = React.useMemo(() => {
    const connected = uavs.filter(u => u.connected).length;
    const disconnected = uavs.length - connected;
    const avgBattery = uavs.length > 0 
      ? uavs.reduce((sum, u) => sum + (u.battery || 0), 0) / uavs.length 
      : 0;
    const criticalBattery = uavs.filter(u => (u.battery || 0) < 30).length;
    
    return {
      total: uavs.length,
      connected,
      disconnected,
      avgBattery: Math.round(avgBattery * 10) / 10,
      criticalBattery
    };
  }, [uavs]);
  
  if (isLoading && uavs.length === 0) {
    return (
      <div className="card" style={{ padding: '1.5rem' }}>
        <h2 style={{ margin: '0 0 1rem 0' }}>UAV Fleet Status</h2>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '2rem',
          color: '#6b7280'
        }}>
          <div className="spinner" style={{
            width: '20px',
            height: '20px',
            border: '3px solid rgba(0,0,0,0.1)',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            marginRight: '0.75rem',
            animation: 'spin 1s linear infinite'
          }}></div>
          Loading UAV status...
        </div>
      </div>
    );
  }

  if (!uavs || uavs.length === 0) {
    return (
      <div className="card" style={{ padding: '1.5rem' }}>
        <h2 style={{ margin: '0 0 1rem 0' }}>UAV Fleet Status</h2>
        <div style={{ 
          textAlign: 'center', 
          color: '#6b7280', 
          padding: '2rem',
          backgroundColor: '#f9fafb',
          borderRadius: '0.5rem'
        }}>
          No UAVs connected
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <h2 style={{ margin: '0 0 1rem 0' }}>UAV Fleet Status ({fleetStats.total} UAVs)</h2>
      
      {isLoading && uavs.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          backgroundColor: '#f9fafb',
          borderRadius: '0.5rem',
          border: '1px dashed #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✈️</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>No UAVs Connected</h3>
          <p style={{ margin: 0, color: '#6b7280' }}>
            Waiting for UAVs to connect...
          </p>
        </div>
      ) : (
        <div className="uav-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem',
          marginTop: '1rem'
        }}>
          {uavs.map((uav) => {
            const {
              uavId,
              status = 'disconnected',
              battery = 0,
              signalStrength = 0,
              dataRate = 0,
              lastUpdate = new Date().toISOString(),
              connected = false,
              isacMode = 'weak',
              location = { lat: 0, lng: 0, alt: 0 }
            } = uav;

            const isConnected = connected;

          return (
            <div 
              key={uavId}
              style={{
                border: `1px solid ${isConnected ? '#e5e7eb' : '#fecaca'}`,
                borderRadius: '0.5rem',
                padding: '1.25rem',
                backgroundColor: isConnected ? '#ffffff' : '#fef2f2',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease',
                opacity: isConnected ? 1 : 0.8
              }}
            >
              {/* UAV Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <div>
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: isConnected ? '#111827' : '#9ca3af'
                  }}>
                    {uavId}
                    {!isConnected && (
                      <span style={{ 
                        fontSize: '0.75rem',
                        color: '#ef4444',
                        marginLeft: '0.5rem',
                        fontWeight: 'normal'
                      }}>
                        (Disconnected)
                      </span>
                    )}
                  </h3>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    marginTop: '0.25rem'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: isConnected ? '#10b981' : '#ef4444',
                      marginRight: '0.5rem'
                    }} />
                    <span style={{ 
                      fontSize: '0.75rem',
                      color: isConnected ? '#10b981' : '#ef4444'
                    }}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => navigate(`/uav/${uavId}`)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#3b82f6',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  View Details
                  <svg 
                    style={{ marginLeft: '0.25rem' }} 
                    width="12" 
                    height="12" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
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
                      color: getBatteryColor(battery) 
                    }}>
                      {(battery || 0).toFixed(1)}%
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
                          width: `${Math.max(0, Math.min(100, battery || 0))}%`,
                          height: '100%',
                          backgroundColor: getBatteryColor(battery),
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
                    color: getISACColor(isacMode)
                  }}>
                    {(signalStrength || 0).toFixed(1)}%
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Data Rate</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                    {(dataRate || 0).toFixed(1)} Mbps
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Altitude</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                    {(location?.alt || 0).toFixed(1)}m
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Status</div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '500',
                    color: getStatusColor(status)
                  }}>
                    {(status || 'unknown').toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#6b7280',
                textAlign: 'center',
                marginBottom: '0.5rem'
              }}>
                📍 {formatCoordinate(location?.lat)}, {formatCoordinate(location?.lng)}
              </div>

              {/* Warning for low battery */}
              {battery < 20 && (
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
              {isacMode === 'weak' && (
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
              {lastUpdate && (
                <div style={{ 
                  marginTop: '0.75rem',
                  fontSize: '0.625rem', 
                  color: '#9ca3af',
                  textAlign: 'center'
                }}>
                  Updated {formatDistanceToNow(new Date(lastUpdate), { addSuffix: true })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}

      {fleetStats && fleetStats.total > 0 && (
        <div style={{ 
          marginTop: '1.5rem',
          padding: '0.75rem',
          backgroundColor: '#f3f4f6',
          borderRadius: '6px'
        }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem' }}>Fleet Summary</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
            gap: '1rem',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Total UAVs</div>
              <div style={{ fontSize: '1rem', fontWeight: '600' }}>{fleetStats.total}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Connected</div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: '#16a34a' }}>{fleetStats.connected}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Disconnected</div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: '#dc2626' }}>{fleetStats.disconnected}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Avg. Battery</div>
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: '600',
                color: getBatteryColor(fleetStats.avgBattery)
              }}>
                {fleetStats.avgBattery}%
              </div>
            </div>
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
      )}
    </div>
  );
};

export default React.memo(MultiUAVStatus);