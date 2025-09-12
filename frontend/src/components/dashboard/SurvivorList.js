import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

const SurvivorList = ({ survivors, loading, onMarkAsRescued }) => {
  const [filter, setFilter] = useState('all'); // all, detected, rescued
  const [sortBy, setSortBy] = useState('timestamp'); // timestamp, confidence

  const filteredSurvivors = survivors
    .filter(survivor => {
      if (filter === 'all') return true;
      return survivor.status === filter;
    })
    .sort((a, b) => {
      if (sortBy === 'confidence') {
        return b.confidence - a.confidence;
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

  const getConfidenceClass = (confidence) => {
    if (confidence >= 0.8) return 'confidence-high';
    if (confidence >= 0.6) return 'confidence-medium';
    return 'confidence-low';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const handleMarkAsRescued = async (survivorId) => {
    if (onMarkAsRescued) {
      await onMarkAsRescued(survivorId);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <h2>Survivors</h2>
        <div className="loading">
          <div className="spinner"></div>
          Loading survivors...
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Survivors ({filteredSurvivors.length})</h2>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={{ 
              padding: '0.25rem 0.5rem', 
              borderRadius: '4px', 
              border: '1px solid #d1d5db',
              fontSize: '0.75rem'
            }}
          >
            <option value="all">All</option>
            <option value="detected">Detected</option>
            <option value="rescued">Rescued</option>
          </select>
          
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{ 
              padding: '0.25rem 0.5rem', 
              borderRadius: '4px', 
              border: '1px solid #d1d5db',
              fontSize: '0.75rem'
            }}
          >
            <option value="timestamp">Latest First</option>
            <option value="confidence">Confidence</option>
          </select>
        </div>
      </div>

      <div className="survivor-list">
        {filteredSurvivors.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
            {filter === 'all' ? 'No survivors detected yet' : `No ${filter} survivors`}
          </div>
        ) : (
          filteredSurvivors.map((survivor) => (
            <div 
              key={survivor.id} 
              className={`survivor-item ${survivor.status === 'rescued' ? 'rescued' : ''}`}
            >
              <div className="survivor-info">
                <h4>
                  {survivor.status === 'rescued' ? '✅' : '🆘'} {survivor.id}
                </h4>
                <p>
                  Lat: {survivor.coordinates.lat.toFixed(4)}, 
                  Lng: {survivor.coordinates.lng.toFixed(4)}
                </p>
                <p>
                  Detected {formatDistanceToNow(new Date(survivor.timestamp), { addSuffix: true })}
                </p>
                {survivor.uavId && (
                  <p>By: {survivor.uavId}</p>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                <span className={`confidence-badge ${getConfidenceClass(survivor.confidence)}`}>
                  {(survivor.confidence * 100).toFixed(1)}% {getConfidenceLabel(survivor.confidence)}
                </span>
                
                {survivor.status === 'detected' && (
                  <button
                    className="rescue-button"
                    onClick={() => handleMarkAsRescued(survivor.id)}
                  >
                    Mark Rescued
                  </button>
                )}
                
                {survivor.status === 'rescued' && (
                  <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '500' }}>
                    Rescued
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default React.memo(SurvivorList);