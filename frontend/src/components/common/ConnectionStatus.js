import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../../context/WebSocketContext';

const ConnectionStatus = ({ isConnected }) => {
  const { connectionError } = useWebSocket();
  const [backendStatus, setBackendStatus] = useState('checking');
  const [lastSuccessfulPing, setLastSuccessfulPing] = useState(null);

  // Check backend health periodically
  useEffect(() => {
    let healthCheckInterval;
    
    const checkBackendHealth = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/health', {
          method: 'GET',
          timeout: 3000
        });
        
        if (response.ok) {
          setBackendStatus('online');
          setLastSuccessfulPing(new Date());
        } else {
          setBackendStatus('error');
        }
      } catch (error) {
        setBackendStatus('offline');
      }
    };

    // Initial check
    checkBackendHealth();
    
    // Check every 10 seconds
    healthCheckInterval = setInterval(checkBackendHealth, 10000);

    return () => {
      if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
      }
    };
  }, []);

  const getStatusMessage = () => {
    if (isConnected && backendStatus === 'online') {
      return 'Connected to Backend';
    } else if (backendStatus === 'offline') {
      return 'Backend Server Offline';
    } else if (backendStatus === 'error') {
      return 'Backend Server Error';
    } else if (backendStatus === 'checking') {
      return 'Checking Backend Status...';
    } else {
      return 'WebSocket Disconnected';
    }
  };

  const getStatusColor = () => {
    if (isConnected && backendStatus === 'online') return 'connected';
    if (backendStatus === 'offline') return 'offline';
    if (backendStatus === 'error') return 'error';
    return 'disconnected';
  };

  return (
    <div className={`connection-status ${getStatusColor()}`}>
      <div className={`connection-indicator ${getStatusColor()}`}></div>
      <div>
        <div style={{ fontWeight: '500' }}>
          {getStatusMessage()}
        </div>
        {connectionError && (
          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
            {connectionError}
          </div>
        )}
        {backendStatus === 'offline' && (
          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
            Start backend: cd backend && npm start
          </div>
        )}
        {lastSuccessfulPing && backendStatus === 'online' && (
          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
            Last ping: {lastSuccessfulPing.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;