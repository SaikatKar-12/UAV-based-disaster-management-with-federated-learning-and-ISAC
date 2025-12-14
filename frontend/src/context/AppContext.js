import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useWebSocket } from './WebSocketContext';
import * as api from '../services/api';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Initial state
const initialState = {
  survivors: [],
  uavs: [
    {
      uavId: 'UAV-001',
      location: { lat: 22.5726, lng: 88.3639, altitude: 50 },
      batteryLevel: 95,
      isacMode: 'good',
      signalStrength: 85,
      dataRate: 50,
      lastUpdate: null,
      status: 'active'
    },
    {
      uavId: 'UAV-002',
      location: { lat: 22.5750, lng: 88.3660, altitude: 45 },
      batteryLevel: 78,
      isacMode: 'medium',
      signalStrength: 60,
      dataRate: 30,
      lastUpdate: null,
      status: 'active'
    },
    {
      uavId: 'UAV-003',
      location: { lat: 22.5700, lng: 88.3620, altitude: 55 },
      batteryLevel: 42,
      isacMode: 'weak',
      signalStrength: 25,
      dataRate: 15,
      lastUpdate: null,
      status: 'active'
    }
  ],
  // Keep backward compatibility
  uavStatus: {
    uavId: 'UAV-001',
    location: { lat: 22.5726, lng: 88.3639, altitude: 50 },
    batteryLevel: 95,
    isacMode: 'good',
    signalStrength: 85,
    dataRate: 50,
    lastUpdate: null
  },
  isacStatus: {
    mode: 'good',
    signalStrength: 100,
    dataRate: 50,
    availableStreams: {
      video: true,
      detections: true,
      modelUpdates: true
    },
    lastUpdate: null
  },
  missionStats: {
    totalDetections: 0,
    survivorsRescued: 0,
    missionDuration: 0,
    areasCovered: 0
  },
  notifications: [],
  loading: {
    survivors: false,
    uavStatus: false
  },
  error: null
};

// Action types
const actionTypes = {
  SET_SURVIVORS: 'SET_SURVIVORS',
  ADD_SURVIVOR: 'ADD_SURVIVOR',
  UPDATE_SURVIVOR: 'UPDATE_SURVIVOR',
  UPDATE_UAV_STATUS: 'UPDATE_UAV_STATUS',
  UPDATE_UAVS: 'UPDATE_UAVS',
  UPDATE_SINGLE_UAV: 'UPDATE_SINGLE_UAV',
  UPDATE_ISAC_STATUS: 'UPDATE_ISAC_STATUS',
  UPDATE_MISSION_STATS: 'UPDATE_MISSION_STATS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR'
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_SURVIVORS:
      return {
        ...state,
        survivors: action.payload,
        loading: { ...state.loading, survivors: false }
      };

    case actionTypes.ADD_SURVIVOR:
      return {
        ...state,
        survivors: [action.payload, ...state.survivors],
        missionStats: {
          ...state.missionStats,
          totalDetections: state.missionStats.totalDetections + 1
        }
      };

    case actionTypes.UPDATE_SURVIVOR:
      return {
        ...state,
        survivors: state.survivors.map(survivor =>
          survivor.id === action.payload.id ? action.payload : survivor
        ),
        missionStats: action.payload.status === 'rescued' ? {
          ...state.missionStats,
          survivorsRescued: state.missionStats.survivorsRescued + 1
        } : state.missionStats
      };

    case actionTypes.UPDATE_UAV_STATUS:
      return {
        ...state,
        uavStatus: {
          ...state.uavStatus,
          ...action.payload,
          lastUpdate: new Date().toISOString()
        }
      };

    case actionTypes.UPDATE_UAVS:
      return {
        ...state,
        uavs: action.payload
      };

    case actionTypes.UPDATE_SINGLE_UAV:
      return {
        ...state,
        uavs: state.uavs.map(uav =>
          uav.uavId === action.payload.uavId
            ? { ...uav, ...action.payload, lastUpdate: new Date().toISOString() }
            : uav
        ),
        // Update main uavStatus if it's UAV-001 for backward compatibility
        uavStatus: action.payload.uavId === 'UAV-001' ? {
          ...state.uavStatus,
          ...action.payload,
          lastUpdate: new Date().toISOString()
        } : state.uavStatus
      };

    case actionTypes.UPDATE_ISAC_STATUS:
      return {
        ...state,
        isacStatus: {
          ...state.isacStatus,
          ...action.payload,
          lastUpdate: new Date().toISOString()
        }
      };

    case actionTypes.UPDATE_MISSION_STATS:
      return {
        ...state,
        missionStats: {
          ...state.missionStats,
          ...action.payload
        }
      };

    case actionTypes.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [
          ...state.notifications,
          { ...action.payload, id: Date.now() }
        ]
      };

    case actionTypes.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.id !== action.payload
        )
      };

    case actionTypes.SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          ...action.payload
        }
      };

    case actionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload
      };

    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { subscribe, isConnected } = useWebSocket();

  // Helper functions (defined first to avoid hoisting issues)
  const addNotification = (notification) => {
    dispatch({
      type: actionTypes.ADD_NOTIFICATION,
      payload: notification
    });

    // Auto-remove notification after duration
    if (notification.duration) {
      setTimeout(() => {
        removeNotification(notification.id || Date.now());
      }, notification.duration);
    }
  };

  const removeNotification = (id) => {
    dispatch({
      type: actionTypes.REMOVE_NOTIFICATION,
      payload: id
    });
  };

  // API functions (defined before useEffect)
  const loadSurvivors = async () => {
    try {
      // Use sample data only; do not call backend survivors API from frontend
      const sampleSurvivors = [
        {
          id: 'SURV-001',
          coordinates: { lat: 22.5730, lng: 88.3645 },
          confidence: 0.85,
          status: 'detected',
          uavId: 'UAV-001',
          timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
          detectionType: 'human'
        },
        {
          id: 'SURV-002',
          coordinates: { lat: 22.5755, lng: 88.3665 },
          confidence: 0.72,
          status: 'detected',
          uavId: 'UAV-002',
          timestamp: new Date(Date.now() - 450000).toISOString(), // 7.5 minutes ago
          detectionType: 'human'
        },
        {
          id: 'SURV-003',
          coordinates: { lat: 22.5705, lng: 88.3625 },
          confidence: 0.58,
          status: 'detected',
          uavId: 'UAV-003',
          timestamp: new Date(Date.now() - 180000).toISOString(), // 3 minutes ago
          detectionType: 'human'
        },
        {
          id: 'SURV-004',
          coordinates: { lat: 22.5720, lng: 88.3640 },
          confidence: 0.92,
          status: 'rescued',
          uavId: 'UAV-001',
          timestamp: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
          detectionType: 'human'
        }
      ];

      dispatch({ type: actionTypes.SET_SURVIVORS, payload: sampleSurvivors });
      dispatch({ type: actionTypes.SET_ERROR, payload: null });
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: { survivors: false } });
    }
  };

  const loadUAVStatus = async (showLoading = true) => {
    try {
      if (showLoading) {
        console.log('🔄 Loading UAV status...');
        dispatch({ type: actionTypes.SET_LOADING, payload: { uavStatus: true } });
      }

      const status = await api.getUAVStatus();
      console.log('✅ UAV status loaded:', status);

      // Update UAV status with the received data
      dispatch({
        type: actionTypes.UPDATE_UAV_STATUS, payload: {
          uavId: status.uavId,
          location: status.location,
          batteryLevel: status.batteryLevel,
          isacMode: status.isacMode,
          signalStrength: status.signalStrength,
          dataRate: status.dataRate,
          cameraActive: status.cameraActive,
          aiModelVersion: status.aiModelVersion,
          lastUpdate: status.lastUpdate
        }
      });

      if (status.isacStatus) {
        dispatch({ type: actionTypes.UPDATE_ISAC_STATUS, payload: status.isacStatus });
      }
      if (status.missionStats) {
        dispatch({ type: actionTypes.UPDATE_MISSION_STATS, payload: status.missionStats });
      }
    } catch (error) {
      console.error('❌ Error loading UAV status:', error);

      // Only set fallback data on initial load, not on refresh
      if (showLoading) {
        // Update all UAVs with sample data
        dispatch({
          type: actionTypes.UPDATE_SINGLE_UAV, payload: {
            uavId: 'UAV-001',
            location: { lat: 22.5726, lng: 88.3639, altitude: 50 },
            batteryLevel: 85,
            isacMode: 'good',
            signalStrength: 75,
            dataRate: 45,
            cameraActive: true,
            aiModelVersion: '1.0.0'
          }
        });

        dispatch({
          type: actionTypes.UPDATE_SINGLE_UAV, payload: {
            uavId: 'UAV-002',
            location: { lat: 22.5750, lng: 88.3660, altitude: 45 },
            batteryLevel: 68,
            isacMode: 'medium',
            signalStrength: 55,
            dataRate: 28,
            cameraActive: true,
            aiModelVersion: '1.0.0'
          }
        });

        dispatch({
          type: actionTypes.UPDATE_SINGLE_UAV, payload: {
            uavId: 'UAV-003',
            location: { lat: 22.5700, lng: 88.3620, altitude: 55 },
            batteryLevel: 32,
            isacMode: 'weak',
            signalStrength: 20,
            dataRate: 12,
            cameraActive: true,
            aiModelVersion: '1.0.0'
          }
        });
      }
    } finally {
      if (showLoading) {
        dispatch({ type: actionTypes.SET_LOADING, payload: { uavStatus: false } });
      }
    }
  };

  const markSurvivorAsRescued = async (survivorId) => {
    try {
      const updatedSurvivor = await api.markSurvivorAsRescued(survivorId);
      dispatch({
        type: actionTypes.UPDATE_SURVIVOR,
        payload: updatedSurvivor
      });

      addNotification({
        type: 'success',
        message: `Survivor ${survivorId} marked as rescued`,
        duration: 3000
      });
    } catch (error) {
      console.error('Error marking survivor as rescued:', error);
      addNotification({
        type: 'error',
        message: 'Failed to mark survivor as rescued',
        duration: 3000
      });
    }
  };

  // Simulate UAV movement and updates
  const simulateUAVUpdates = () => {
    const currentTime = Date.now() / 1000; // Current time in seconds

    const updatedUAVs = state.uavs.map((uav, index) => {
      // Different movement patterns for each UAV
      let newLat = uav.location.lat;
      let newLng = uav.location.lng;
      let newAlt = uav.location.altitude;

      // Movement speed and patterns
      const timeOffset = currentTime * 0.1; // Slow down the movement

      if (uav.uavId === 'UAV-001') {
        // Spiral pattern
        const radius = 0.002; // ~200m in degrees
        newLat = 22.5726 + radius * Math.cos(timeOffset + index * 2);
        newLng = 88.3639 + radius * Math.sin(timeOffset + index * 2);
        newAlt = 50 + 15 * Math.sin(timeOffset * 0.5); // Altitude variation
      } else if (uav.uavId === 'UAV-002') {
        // Linear back and forth
        newLat = 22.5750 + 0.001 * Math.sin(timeOffset * 0.7);
        newLng = 88.3660 + 0.002 * Math.cos(timeOffset * 0.5);
        newAlt = Math.floor(timeOffset / 30) % 2 === 0 ? 45 : 65; // Step altitude
      } else if (uav.uavId === 'UAV-003') {
        // Random-ish movement
        newLat = 22.5700 + 0.0015 * Math.sin(timeOffset * 0.3 + 1);
        newLng = 88.3620 + 0.0015 * Math.cos(timeOffset * 0.4 + 2);
        newAlt = 30 + Math.abs(20 * Math.sin(timeOffset * 0.2)); // Random altitude
      }

      // Simulate battery drain
      const batteryDrain = 0.05; // 0.05% per update
      const newBattery = Math.max(0, uav.batteryLevel - batteryDrain);

      // Simulate signal strength variation
      const baseSignal = uav.uavId === 'UAV-001' ? 85 : uav.uavId === 'UAV-002' ? 60 : 25;
      const signalVariation = (Math.random() - 0.5) * 20; // ±10% variation
      const newSignal = Math.max(10, Math.min(95, baseSignal + signalVariation));

      // Determine ISAC mode based on signal
      let isacMode = 'weak';
      let dataRate = 10;
      if (newSignal >= 70) {
        isacMode = 'good';
        dataRate = 45 + (newSignal - 70) * 0.5;
      } else if (newSignal >= 45) {
        isacMode = 'medium';
        dataRate = 25 + (newSignal - 45) * 0.8;
      } else {
        isacMode = 'weak';
        dataRate = 10 + newSignal * 0.3;
      }

      return {
        ...uav,
        location: {
          lat: newLat,
          lng: newLng,
          altitude: newAlt
        },
        batteryLevel: newBattery,
        signalStrength: newSignal,
        isacMode: isacMode,
        dataRate: Math.round(dataRate * 10) / 10,
        lastUpdate: new Date().toISOString()
      };
    });

    // Update all UAVs
    dispatch({ type: actionTypes.UPDATE_UAVS, payload: updatedUAVs });

    // Update main UAV status for backward compatibility
    if (updatedUAVs.length > 0) {
      const mainUAV = updatedUAVs[0];
      dispatch({
        type: actionTypes.UPDATE_UAV_STATUS, payload: {
          uavId: mainUAV.uavId,
          location: mainUAV.location,
          batteryLevel: mainUAV.batteryLevel,
          isacMode: mainUAV.isacMode,
          signalStrength: mainUAV.signalStrength,
          dataRate: mainUAV.dataRate
        }
      });
    }
  };

  // Load initial data with retry logic
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;

    const loadInitialData = async () => {
      try {
        await loadSurvivors();
        await loadUAVStatus();
        retryCount = 0; // Reset on success
      } catch (error) {
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`Retrying initial data load (${retryCount}/${maxRetries})...`);
          setTimeout(loadInitialData, 2000 * retryCount); // Exponential backoff
        } else {
          console.log('Max retries reached for initial data load');
        }
      }
    };

    loadInitialData();
  }, []);

  // Start UAV simulation
  useEffect(() => {
    const simulationInterval = setInterval(() => {
      simulateUAVUpdates();
    }, 3000); // Update every 3 seconds

    return () => clearInterval(simulationInterval);
  }, []);

  // WebSocket event subscriptions
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribers = [
      // Survivor detected
      subscribe('survivor_detected', (data) => {
        console.log('🔍 New survivor detected:', data.survivor);
        dispatch({
          type: actionTypes.ADD_SURVIVOR,
          payload: data.survivor
        });

        addNotification({
          type: 'success',
          message: `New survivor detected with ${(data.survivor.confidence * 100).toFixed(1)}% confidence`,
          duration: 5000
        });
      }),

      // ISAC mode changed
      subscribe('isac_mode_changed', (data) => {
        console.log('📡 ISAC mode changed:', data.isacMode);
        dispatch({
          type: actionTypes.UPDATE_ISAC_STATUS,
          payload: {
            mode: data.isacMode,
            signalStrength: data.signalStrength,
            dataRate: data.dataRate
          }
        });

        dispatch({
          type: actionTypes.UPDATE_UAV_STATUS,
          payload: {
            location: data.location,
            isacMode: data.isacMode,
            signalStrength: data.signalStrength
          }
        });
      }),

      // UAV data update
      subscribe('uav_data_update', (data) => {
        dispatch({
          type: actionTypes.UPDATE_UAV_STATUS,
          payload: {
            location: data.location,
            batteryLevel: data.batteryLevel,
            isacMode: data.isacMode,
            signalStrength: data.signalStrength
          }
        });
      }),

      // Survivor rescued
      subscribe('survivor_rescued', (data) => {
        console.log('✅ Survivor rescued:', data.survivor);
        dispatch({
          type: actionTypes.UPDATE_SURVIVOR,
          payload: data.survivor
        });

        addNotification({
          type: 'success',
          message: `Survivor ${data.survivor.id} marked as rescued`,
          duration: 3000
        });
      })
    ];

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [isConnected, subscribe]);



  const value = {
    ...state,
    actions: {
      loadSurvivors,
      loadUAVStatus,
      markSurvivorAsRescued,
      addNotification,
      removeNotification
    }
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};