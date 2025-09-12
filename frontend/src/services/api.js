import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Error:', error);
    
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || error.response.data?.error || 'Server error';
      throw new Error(message);
    } else if (error.request) {
      // Request made but no response received
      throw new Error('Network error - please check your connection');
    } else {
      // Something else happened
      throw new Error(error.message || 'Unknown error occurred');
    }
  }
);

// API functions

/**
 * Get all survivors
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} Array of survivors
 */
export const getSurvivors = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.status) params.append('status', filters.status);
  if (filters.uavId) params.append('uavId', filters.uavId);
  if (filters.minConfidence) params.append('minConfidence', filters.minConfidence);
  if (filters.limit) params.append('limit', filters.limit);
  
  const queryString = params.toString();
  const url = queryString ? `/survivors?${queryString}` : '/survivors';
  
  return await api.get(url);
};

/**
 * Get survivor by ID
 * @param {string} survivorId - Survivor ID
 * @returns {Promise<Object>} Survivor object
 */
export const getSurvivor = async (survivorId) => {
  return await api.get(`/survivors/${survivorId}`);
};

/**
 * Mark survivor as rescued
 * @param {string} survivorId - Survivor ID
 * @param {string} rescuedBy - Optional rescuer information
 * @returns {Promise<Object>} Updated survivor object
 */
export const markSurvivorAsRescued = async (survivorId, rescuedBy = null) => {
  return await api.put(`/survivors/${survivorId}/rescue`, { rescuedBy });
};

/**
 * Update survivor status
 * @param {string} survivorId - Survivor ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated survivor object
 */
export const updateSurvivor = async (survivorId, updates) => {
  return await api.put(`/survivors/${survivorId}`, updates);
};

/**
 * Get UAV status
 * @param {string} uavId - UAV ID (optional)
 * @returns {Promise<Object>} UAV status object
 */
export const getUAVStatus = async (uavId = 'UAV-001') => {
  return await api.get(`/uav/status?uavId=${uavId}`);
};

/**
 * Get UAV telemetry history
 * @param {string} uavId - UAV ID (optional)
 * @param {number} limit - Number of records to fetch
 * @returns {Promise<Object>} Telemetry data
 */
export const getUAVTelemetry = async (uavId = 'UAV-001', limit = 50) => {
  return await api.get(`/uav/telemetry?uavId=${uavId}&limit=${limit}`);
};

/**
 * Get ISAC status
 * @param {string} uavId - UAV ID (optional)
 * @returns {Promise<Object>} ISAC status object
 */
export const getISACStatus = async (uavId = 'UAV-001') => {
  return await api.get(`/isac/status?uavId=${uavId}`);
};

/**
 * Get mission statistics
 * @param {string} missionId - Mission ID (optional)
 * @returns {Promise<Object>} Mission statistics
 */
export const getMissionStats = async (missionId = null) => {
  const url = missionId ? `/missions/${missionId}/stats` : '/missions/stats';
  return await api.get(url);
};

/**
 * Get all missions
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} Array of missions
 */
export const getMissions = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.status) params.append('status', filters.status);
  if (filters.uavId) params.append('uavId', filters.uavId);
  if (filters.limit) params.append('limit', filters.limit);
  
  const queryString = params.toString();
  const url = queryString ? `/missions?${queryString}` : '/missions';
  
  return await api.get(url);
};

/**
 * Health check
 * @returns {Promise<Object>} Health status
 */
export const healthCheck = async () => {
  return await api.get('/health');
};

/**
 * Authentication functions
 */

/**
 * Login user
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<Object>} Login response with token
 */
export const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  
  if (response.token) {
    localStorage.setItem('authToken', response.token);
  }
  
  return response;
};

/**
 * Logout user
 */
export const logout = () => {
  localStorage.removeItem('authToken');
};

/**
 * Get current user
 * @returns {Promise<Object>} User object
 */
export const getCurrentUser = async () => {
  return await api.get('/auth/me');
};

export default api;