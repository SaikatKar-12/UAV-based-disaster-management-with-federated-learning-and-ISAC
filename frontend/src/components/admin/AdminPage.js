import React from 'react';
import { useWebSocket } from '../../context/WebSocketContext';

// Helper function to determine disaster zone based on position
const getDisasterZone = (position) => {
  if (!position || position.length < 2) return 'Disaster Area 1';
  
  const [x, y] = position;
  
  // Simple zone classification based on coordinates
  // You can modify these zones based on your actual disaster area mapping
  if (x < 50 && y < 50) return 'Disaster Area 1';
  if (x >= 50 && y < 50) return 'Disaster Area 2';
  if (x < 50 && y >= 50) return 'Disaster Area 3';
  if (x >= 50 && y >= 50) return 'Disaster Area 4';
  
  return 'Disaster Area 1';
};

// Helper function to format timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Unknown time';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
};

// Helper function to get zone color
const getZoneColor = (zone) => {
  if (zone.includes('Disaster Area 1')) return '#ef4444'; // Red
  if (zone.includes('Disaster Area 2')) return '#f59e0b'; // Amber
  if (zone.includes('Disaster Area 3')) return '#3b82f6'; // Blue
  if (zone.includes('Disaster Area 4')) return '#10b981'; // Green
  return '#6b7280'; // Gray
};

const AdminPage = () => {
  const { adminImages } = useWebSocket();

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <h2 style={{ margin: '0 0 1rem 0' }}>Admin - Master UAV Images (Live)</h2>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
        Real-time images from UAVs with location and zone information
      </p>
      {adminImages.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem', 
          backgroundColor: '#f9fafb',
          borderRadius: '0.5rem',
          border: '2px dashed #e5e7eb'
        }}>
          <p style={{ color: '#6b7280', margin: 0 }}>
            No images received yet. Once the master UAV sends images, they will appear here.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem',
            marginTop: '1rem',
          }}
        >
          {adminImages.map((img, index) => {
            const zone = getDisasterZone(img.position);
            const zoneColor = getZoneColor(zone);
            
            return (
              <div
                key={`${img.fileName || 'img'}-${index}`}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  padding: '0.75rem',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                }}
              >
                {/* Image */}
                <img
                  src={img.objectUrl}
                  alt={img.fileName || 'UAV image'}
                  style={{ 
                    width: '100%', 
                    height: '180px', 
                    objectFit: 'cover',
                    borderRadius: '0.5rem',
                    backgroundColor: '#f3f4f6'
                  }}
                />
                
                {/* Info Section */}
                <div style={{ marginTop: '0.75rem' }}>
                  {/* UAV ID Badge */}
                  <div style={{
                    display: 'inline-block',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                  }}>
                    🚁 {img.uavId || 'Unknown UAV'}
                  </div>
                  
                  {/* Disaster Zone Badge */}
                  <div style={{
                    display: 'inline-block',
                    backgroundColor: zoneColor,
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    marginLeft: '0.5rem'
                  }}>
                    📍 {zone}
                  </div>
                  
                  {/* Filename */}
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#1f2937',
                    marginTop: '0.5rem',
                    wordBreak: 'break-word',
                  }}>
                    {img.fileName || 'UAV image'}
                  </div>
                  
                  {/* Timestamp */}
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    marginTop: '0.25rem',
                  }}>
                    🕐 {formatTimestamp(img.timestamp)}
                  </div>
                  
                  {/* Position (if available) */}
                  {img.position && img.position.length >= 2 && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      marginTop: '0.25rem',
                    }}>
                      📍 Position: [{img.position[0].toFixed(1)}, {img.position[1].toFixed(1)}]
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminPage;
