import React from 'react';
import { useWebSocket } from '../../context/WebSocketContext';

const AdminPage = () => {
  const { adminImages } = useWebSocket();

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <h2 style={{ margin: '0 0 1rem 0' }}>Admin - Master UAV Images (Live)</h2>
      {adminImages.length === 0 ? (
        <p>No images received yet. Once the master UAV sends images, they will appear here.</p>
      ) : (
        <div
          style={
            {
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem',
              marginTop: '1rem',
            }
          }
        >
          {adminImages.map((img, index) => (
            <div
              key={`${img.fileName || 'img'}-${index}`}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '0.5rem',
                backgroundColor: '#ffffff',
              }}
            >
              <img
                src={img.objectUrl}
                alt={img.fileName || 'UAV image'}
                style={{ width: '100%', height: 'auto', borderRadius: '0.25rem' }}
              />
              <div
                style={{
                  fontSize: '0.75rem',
                  marginTop: '0.25rem',
                  color: '#6b7280',
                  wordBreak: 'break-all',
                }}
              >
                {img.fileName || 'UAV image'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPage;
