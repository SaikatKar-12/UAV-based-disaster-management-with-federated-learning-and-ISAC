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
  uavStatus: {
    uavId: 'UAV-001',
    location: { lat: 12.9716, lng: 77.5946, altitude: 50 },
    batteryLevel: 100,
    isacMode: 'good',
    signalStrength: 100,
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
      console.log('🔄 Loading survivors...');
      dispatch({ type: actionTypes.SET_LOADING, payload: { survivors: true } });
      const survivors = await api.getSurvivors();
      console.log('✅ Survivors loaded:', survivors);
      dispatch({ type: actionTypes.SET_SURVIVORS, payload: survivors });
      dispatch({ type: actionTypes.SET_ERROR, payload: null }); // Clear error on success
    } catch (error) {
      console.error('❌ Error loading survivors:', error);
      
      // Use sample data when backend is not available
      const sampleSurvivors = [
        {
          id: 'SURV-001',
          coordinates: { lat: 12.9720, lng: 77.5950 },
          confidence: 0.85,
          status: 'detected',
          uavId: 'UAV-001',
          timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
          detectionType: 'human'
        },
        {
          id: 'SURV-002',
          coordinates: { lat: 12.9710, lng: 77.5940 },
          confidence: 0.92,
          status: 'rescued',
          uavId: 'UAV-001',
          timestamp: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
          detectionType: 'human'
        }
      ];
      
      dispatch({ type: actionTypes.SET_SURVIVORS, payload: sampleSurvivors });
      
      // Only show error notification if it's not a network error (backend down)
      if (!error.message.includes('Network error')) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      }
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
      dispatch({ type: actionTypes.UPDATE_UAV_STATUS, payload: {
        uavId: status.uavId,
        location: status.location,
        batteryLevel: status.batteryLevel,
        isacMode: status.isacMode,
        signalStrength: status.signalStrength,
        dataRate: status.dataRate,
        cameraActive: status.cameraActive,
        aiModelVersion: status.aiModelVersion,
        lastUpdate: status.lastUpdate
      }});
      
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
        dispatch({ type: actionTypes.UPDATE_UAV_STATUS, payload: {
          uavId: 'UAV-001',
          location: { lat: 12.9716, lng: 77.5946, altitude: 50 },
          batteryLevel: 85,
          isacMode: 'medium',
          signalStrength: 45,
          dataRate: 25,
          cameraActive: true,
          aiModelVersion: '1.0.0',
          lastUpdate: new Date().toISOString()
        }});
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