import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [uavs, setUAVs] = useState({});
  const [selectedUAV, setSelectedUAV] = useState(null);
  const [eventListeners, setEventListeners] = useState({});
  const [adminImages, setAdminImages] = useState([]);

  // Function to send commands to UAVs
  const sendCommand = useCallback((uavId, command, params = {}) => {
    if (socket && isConnected) {
      socket.emit('command', {
        target: uavId,
        command,
        params,
        timestamp: new Date().toISOString()
      });
      return true;
    }
    return false;
  }, [socket, isConnected]);

  // Function to update UAV status
  const updateUAVStatus = useCallback((uavId, status) => {
    setUAVs(prevUAVs => ({
      ...prevUAVs,
      [uavId]: {
        ...prevUAVs[uavId],
        ...status,
        lastUpdate: new Date().toISOString(),
        connected: true
      }
    }));
  }, []);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_BACKEND_URL || 'https://uav-backend.onrender.com', {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 3,
      maxReconnectionAttempts: 3,
      forceNew: true
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    // Handle UAV connection events
    newSocket.on('uav_connected', (data) => {
      // console.log(`UAV connected: ${data.uavId}`, data);
      updateUAVStatus(data.uavId, {
        id: data.uavId,
        connected: true,
        status: 'connected',
        position: [0, 0, 0],
        velocity: [0, 0, 0],
        battery: 100,
        isMaster: !!data.isMaster,
        currentMasterId: data.currentMasterId || null
      });
      
      // Select the first connected UAV by default
      setSelectedUAV(prev => prev || data.uavId);
    });

    // Handle UAV status updates from backend
    newSocket.on('uav_status_update', (data) => {
      // console.log('Received UAV status update:', data);
      
      // Process and normalize the status data
      const statusUpdate = {
        ...data,
        // Ensure required fields with defaults
        uavId: data.uavId,
        position: data.position || [0, 0, 0],
        battery: data.battery ?? 0,
        status: data.status || 'connected',
        signalStrength: data.signalStrength ?? 0,
        dataRate: data.dataRate ?? 0,
        isacMode: data.isacMode || 'weak',
        velocity: data.velocity || [0, 0, 0],
        lastUpdate: new Date().toISOString(),
        isMaster: !!data.isMaster,
        currentMasterId: data.currentMasterId || null
      };

      // console.log('Processed UAV status:', statusUpdate);
      
      // Update the UAV status in state
      setUAVs(prevUAVs => ({
        ...prevUAVs,
        [statusUpdate.uavId]: {
          ...prevUAVs[statusUpdate.uavId],
          ...statusUpdate,
          connected: true
        }
      }));
    });

    // Handle UAV disconnection
    newSocket.on('uav_disconnected', (data) => {
      console.log(`UAV disconnected: ${data.uavId}`);
      setUAVs(prevUAVs => {
        const updated = { ...prevUAVs };
        if (updated[data.uavId]) {
          updated[data.uavId] = {
            ...updated[data.uavId],
            connected: false,
            status: 'disconnected'
          };
        }
        return updated;
      });
    });

    // Reconnection handlers
    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`🔁 WebSocket reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔁 Attempting to reconnect (${attemptNumber})...`);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('WebSocket reconnection error:', error);
      setConnectionError(`Reconnection failed: ${error.message}`);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed after maximum attempts');
      setConnectionError('Failed to reconnect to server');
    });

    // Receive master UAV images for Admin view (direct from backend relay)
    newSocket.on('frontend_master_image', (data) => {
      // data: { uavId, fileName, mimeType, data (base64), timestamp }
      setAdminImages(prev => [
        {
          ...data,
          objectUrl: `data:${data.mimeType};base64,${data.data}`
        },
        ...prev
      ]);
    });

    setSocket(newSocket);

    // Cleanup function
    return () => {
      console.log('Cleaning up WebSocket connection');
      newSocket.disconnect();
    };
  }, [updateUAVStatus]);

  // Subscribe to WebSocket events
  const subscribe = useCallback((event, callback) => {
    if (!socket) return () => {};
    
    // Add the event listener
    socket.on(event, callback);
    
    // Store the listener for cleanup
    setEventListeners(prev => ({
      ...prev,
      [event]: [...(prev[event] || []), callback]
    }));
    
    // Return unsubscribe function
    return () => {
      if (socket) {
        socket.off(event, callback);
      }
      setEventListeners(prev => ({
        ...prev,
        [event]: (prev[event] || []).filter(cb => cb !== callback)
      }));
    };
  }, [socket]);

  // Clean up all event listeners on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        // Remove all event listeners
        Object.entries(eventListeners).forEach(([event, callbacks]) => {
          callbacks.forEach(callback => {
            socket.off(event, callback);
          });
        });
      }
    };
  }, [socket, eventListeners]);

  // Context value
  const value = {
    socket,
    isConnected,
    connectionError,
    uavs,
    selectedUAV,
    setSelectedUAV,
    sendCommand,
    updateUAVStatus,
    subscribe,
    adminImages
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};