import React from 'react';

const MissionStats = ({ stats, survivorsCount }) => {
  const detectedCount = survivorsCount || stats.totalDetections || 0;
  const rescuedCount = stats.survivorsRescued || 0;
  const rescueRate = detectedCount > 0 ? (rescuedCount / detectedCount * 100) : 0;

  const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getSuccessRateColor = (rate) => {
    if (rate >= 80) return '#16a34a';
    if (rate >= 60) return '#d97706';
    return '#dc2626';
  };

  return (
    <div className="card">
      <h2>Mission Statistics</h2>
      
      {/* Main Stats Grid */}
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-value" style={{ color: '#3b82f6' }}>
            {detectedCount}
          </div>
          <div className="stat-label">Survivors Detected</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-value" style={{ color: '#16a34a' }}>
            {rescuedCount}
          </div>
          <div className="stat-label">Survivors Rescued</div>
        </div>
      </div>

      {/* Success Rate */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Rescue Success Rate</span>
          <span style={{ 
            fontSize: '0.875rem', 
            fontWeight: '600',
            color: getSuccessRateColor(rescueRate)
          }}>
            {rescueRate.toFixed(1)}%
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
              width: `${Math.max(0, Math.min(100, rescueRate))}%`,
              height: '100%',
              backgroundColor: getSuccessRateColor(rescueRate),
              transition: 'width 0.3s ease'
            }}
          />
        </div>
      </div>

      {/* Additional Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="info-item">
          <span className="info-label">Mission Duration</span>
          <span className="info-value">{formatDuration(stats.missionDuration)}</span>
        </div>
        
        <div className="info-item">
          <span className="info-label">Areas Covered</span>
          <span className="info-value">{stats.areasCovered || 0}</span>
        </div>
      </div>

      {/* Mission Status Indicators */}
      <div style={{ marginTop: '1rem' }}>
        <h3>Mission Status</h3>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
              {detectedCount > 0 ? '🔍' : '👀'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {detectedCount > 0 ? 'Detecting' : 'Searching'}
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
              {rescuedCount > 0 ? '🚑' : '⏳'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {rescuedCount > 0 ? 'Rescuing' : 'Standby'}
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
              {rescueRate >= 80 ? '✅' : rescueRate >= 60 ? '⚠️' : '❌'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              Efficiency
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      {detectedCount > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ 
            padding: '0.75rem', 
            backgroundColor: '#f9fafb', 
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              Performance Summary
            </div>
            
            <div style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.4' }}>
              {detectedCount === 1 ? '1 survivor has been' : `${detectedCount} survivors have been`} detected during this mission.
              {rescuedCount > 0 && (
                <> {rescuedCount === 1 ? '1 has been' : `${rescuedCount} have been`} successfully rescued.</>
              )}
              {rescueRate >= 80 && <> Excellent rescue efficiency!</>}
              {rescueRate >= 60 && rescueRate < 80 && <> Good rescue performance.</>}
              {rescueRate < 60 && rescuedCount > 0 && <> Rescue operations in progress.</>}
            </div>
          </div>
        </div>
      )}

      {/* No Activity State */}
      {detectedCount === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '1.5rem', 
          color: '#6b7280',
          fontSize: '0.875rem'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
          <div>UAV is actively searching for survivors...</div>
          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
            Detection data will appear here when survivors are found
          </div>
        </div>
      )}
    </div>
  );
};

export default MissionStats;