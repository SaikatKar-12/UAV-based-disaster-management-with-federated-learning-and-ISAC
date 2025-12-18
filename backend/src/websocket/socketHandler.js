/**
 * WebSocket Event Handler
 * Manages real-time communication with UAVs and frontend clients
 */

const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Store connected UAVs and their data
const connectedUAVs = new Map();

// Master-slave management
let currentMasterId = null;
const MASTER_ROTATION_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
let masterRotationInterval = null;

// Scoring weights for master election
const WEIGHTS = {
    SNR: 0.4,        // w1: Signal-to-Noise Ratio weight
    BATTERY: 0.3,    // w2: Battery level weight  
    DISTANCE: 0.3    // w3: Distance to center weight
};

// Center point for distance calculations (default: Kolkata)
const CENTER_POINT = { lat: 22.5726, lng: 88.3639 };

// Helper: get list of currently connected UAV IDs
const getConnectedUavIds = () => {
    return Array.from(connectedUAVs.entries())
        .filter(([, uav]) => uav && uav.socket && uav.socket.connected)
        .map(([uavId]) => uavId);
};

// Helper: calculate UAV score for master election
const calculateUAVScore = (uav) => {
    if (!uav) return 0;
    
    // Extract UAV metrics
    const snr = uav.signalStrength || 50; // Default 50% if not available
    const battery = uav.battery || 50;    // Default 50% if not available
    const position = uav.position || [0, 0, 0];
    
    // Calculate distance to center (simplified: use x,y as lat/lng approximation)
    const distance = Math.sqrt(
        Math.pow(position[0] - CENTER_POINT.lat, 2) + 
        Math.pow(position[1] - CENTER_POINT.lng, 2)
    );
    const distanceScore = distance > 0 ? (1 / distance) : 1;
    
    // Normalize values to 0-1 range
    const normalizedSNR = Math.min(100, Math.max(0, snr)) / 100;
    const normalizedBattery = Math.min(100, Math.max(0, battery)) / 100;
    const normalizedDistance = Math.min(1, distanceScore); // Cap at 1
    
    // Calculate weighted score
    const score = (
        WEIGHTS.SNR * normalizedSNR +
        WEIGHTS.BATTERY * normalizedBattery + 
        WEIGHTS.DISTANCE * normalizedDistance
    );
    
    return Math.round(score * 100) / 100; // Round to 2 decimal places
};

// Helper: elect master based on highest score
const electNextMaster = (reason = 'rotation') => {
    const ids = getConnectedUavIds();
    if (ids.length === 0) {
        if (currentMasterId) {
            console.log(`👑 Clearing master (no UAVs connected). Previous master: ${currentMasterId}`);
        }
        currentMasterId = null;
        return null;
    }

    // Calculate scores for all UAVs
    const uavScores = [];
    ids.forEach(uavId => {
        const uav = connectedUAVs.get(uavId);
        const score = calculateUAVScore(uav);
        uavScores.push({ uavId, score, snr: uav?.signalStrength, battery: uav?.battery });
    });
    
    // Sort by score (highest first)
    uavScores.sort((a, b) => b.score - a.score);
    
    const bestUAV = uavScores[0];
    const nextId = bestUAV.uavId;
    
    if (nextId !== currentMasterId) {
        console.log(`👑 New master elected: ${nextId} (reason: ${reason})`);
        console.log(`📊 Master scores: ${uavScores.map(u => `${u.uavId}: ${u.score} (SNR:${u.snr}%, Bat:${u.battery}%)`).join(', ')}`);
    }
    
    currentMasterId = nextId;
    return currentMasterId;
};

const socketHandler = (io) => {
    console.log('🚀 WebSocket handler initialized');

    // Clean up disconnected UAVs periodically
    const cleanupInterval = setInterval(() => {
        const now = Date.now();
        let cleaned = 0;

        connectedUAVs.forEach((uav, uavId) => {
            // If no status update in last 30 seconds, consider UAV disconnected
            if (now - uav.lastSeen > 30000) {
                console.log(`🚁 UAV ${uavId} timed out (last seen: ${new Date(uav.lastSeen).toISOString()})`);
                if (uav.socket) {
                    uav.socket.disconnect();
                }
                connectedUAVs.delete(uavId);

                cleaned++;

                // Notify all clients about the disconnected UAV
                io.emit('uav_disconnected', {
                    uavId,
                    isMaster: currentMasterId === uavId,
                    currentMasterId,
                    reason: 'timeout',
                    timestamp: new Date().toISOString()
                });
            }
        });

        if (cleaned > 0) {
            console.log(`🧹 Cleaned up ${cleaned} inactive UAVs`);
        }
    }, 60000); // Check every minute

    // Start master rotation timer
    if (!masterRotationInterval) {
        masterRotationInterval = setInterval(() => {
            electNextMaster('timer');
        }, MASTER_ROTATION_INTERVAL_MS);
    }

    io.on('connection', (socket) => {
        console.log(`🔌 New connection: ${socket.id}`);
        let uavId = null;

        // Handle UAV registration
        socket.on('register_uav', (data, callback) => {
            try {
                uavId = data.uavId || `uav-${uuidv4().substring(0, 6)}`;
                const existingUAV = connectedUAVs.get(uavId);

                if (existingUAV && existingUAV.socket && existingUAV.socket.connected) {
                    console.log(`⚠️ UAV ${uavId} already connected, disconnecting previous instance`);
                    existingUAV.socket.disconnect();
                }

                // Register new UAV
                connectedUAVs.set(uavId, {
                    socket,
                    id: uavId,
                    position: data.position || [0, 0, 0],
                    battery: data.battery || 100,
                    status: 'connected',
                    lastSeen: Date.now(),
                    capabilities: data.capabilities || [],
                    metadata: data.metadata || {}
                });

                console.log(`🚁 UAV ${uavId} registered (${socket.id})`);

                // Ensure we have a master after this registration (if none yet)
                if (!currentMasterId) {
                    electNextMaster('first_connection');
                }

                // Acknowledge registration
                const response = {
                    success: true,
                    uavId,
                    status: 'connected',
                    timestamp: new Date().toISOString()
                };

                if (typeof callback === 'function') {
                    callback(response);
                }

                // Notify all clients about the new UAV
                io.emit('uav_connected', {
                    ...response,
                    position: data.position || [0, 0, 0],
                    battery: data.battery || 100,
                    isMaster: currentMasterId === uavId,
                    currentMasterId
                });

                // Send current list of UAVs to the new connection
                socket.emit('uav_list', Array.from(connectedUAVs.values()).map(uav => ({
                    id: uav.id,
                    position: uav.position,
                    battery: uav.battery,
                    status: uav.status,
                    lastSeen: uav.lastSeen
                })));

            } catch (error) {
                console.error('Error during UAV registration:', error);
                if (typeof callback === 'function') {
                    callback({
                        success: false,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        });

        // Handle UAV status updates
        socket.on('uav_status', (data, callback) => {
            if (!uavId) return;

            const uav = connectedUAVs.get(uavId);
            if (!uav) return;

            // Update UAV status
            uav.position = data.position || uav.position;
            uav.velocity = data.velocity || [0, 0, 0];
            uav.battery = data.battery !== undefined ? data.battery : uav.battery;
            uav.status = data.status || uav.status;
            uav.lastSeen = Date.now();

            if (data.metadata) {
                uav.metadata = { ...uav.metadata, ...data.metadata };
            }

            // Ensure there is always a master selected when status updates are flowing
            if (!currentMasterId) {
                electNextMaster('status_update');
            }

            // Broadcast status to all clients
            io.emit('uav_status_update', {
                uavId,
                position: uav.position,
                velocity: uav.velocity,
                battery: uav.battery,
                status: uav.status,
                isMaster: currentMasterId === uavId,
                currentMasterId,
                timestamp: new Date().toISOString()
            });

            if (typeof callback === 'function') {
                callback({ success: true });
            }
        });

        // Handle master UAV images for direct frontend display (no backend storage)
        socket.on('master_image', (data) => {
            try {
                if (!uavId) {
                    throw new Error('UAV not registered');
                }

                const payload = {
                    ...data,
                    uavId,
                    timestamp: data.timestamp || new Date().toISOString()
                };

                // Broadcast to all frontend clients
                io.emit('frontend_master_image', payload);
            } catch (error) {
                console.error('Error handling master_image:', error);
            }
        });

        // Handle image uploads from UAVs
        socket.on('uav_image', (data, callback) => {
            try {
                if (!uavId) {
                    throw new Error('UAV not registered');
                }

                const { fileName = 'image', mimeType = 'image/jpeg', data: base64Data } = data;
                if (!base64Data) {
                    throw new Error('No image data provided');
                }

                const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'uav-images');
                fs.mkdirSync(uploadsDir, { recursive: true });

                const safeName = fileName.replace(/[^a-zA-Z0-9_.-]/g, '_');
                const ext = mimeType === 'image/png' ? '.png' : '.jpg';
                const finalName = `${uavId}-${Date.now()}-${safeName}${safeName.endsWith(ext) ? '' : ext}`;
                const filePath = path.join(uploadsDir, finalName);

                const buffer = Buffer.from(base64Data, 'base64');
                fs.writeFileSync(filePath, buffer);

                console.log(`📸 Saved image from ${uavId} to ${filePath}`);

                if (typeof callback === 'function') {
                    callback({ success: true, filePath });
                }
            } catch (error) {
                console.error('Error handling uav_image:', error);
                if (typeof callback === 'function') {
                    callback({ success: false, error: error.message });
                }
            }
        });

        // Handle commands from dashboard to UAVs
        socket.on('send_command', (data, callback) => {
            const { uavId: targetUavId, command, params = {} } = data;

            if (!targetUavId) {
                return callback({
                    success: false,
                    error: 'No UAV ID specified',
                    timestamp: new Date().toISOString()
                });
            }

            const uav = connectedUAVs.get(targetUavId);
            if (!uav || !uav.socket || !uav.socket.connected) {
                return callback({
                    success: false,
                    error: `UAV ${targetUavId} not connected`,
                    timestamp: new Date().toISOString()
                });
            }

            const commandId = `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

            // Send command to UAV
            uav.socket.emit('command', {
                command,
                params,
                commandId,
                timestamp: new Date().toISOString()
            });

            // Set up response listener
            const onResponse = (response) => {
                if (response.commandId === commandId) {
                    // Clean up the listener
                    socket.off('command_response', onResponse);

                    // Forward the response to the original sender
                    if (typeof callback === 'function') {
                        callback({
                            ...response,
                            uavId: targetUavId,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            };

            // Listen for the response
            socket.on('command_response', onResponse);

            // Set timeout for command response
            const timeout = setTimeout(() => {
                socket.off('command_response', onResponse);
                if (typeof callback === 'function') {
                    callback({
                        success: false,
                        error: 'Command timeout',
                        commandId,
                        uavId: targetUavId,
                        timestamp: new Date().toISOString()
                    });
                }
            }, 10000); // 10 second timeout

            // Clean up timeout if response is received
            socket.once('command_response', (response) => {
                if (response.commandId === commandId) {
                    clearTimeout(timeout);
                }
            });
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            if (uavId) {
                const uav = connectedUAVs.get(uavId);
                if (uav) {
                    console.log(`🚁 UAV ${uavId} disconnected (${socket.id})`);

                    // Only remove if it's the same socket
                    if (uav.socket && uav.socket.id === socket.id) {
                        connectedUAVs.delete(uavId);

                        // If the master disconnected, elect a new one
                        if (currentMasterId === uavId) {
                            electNextMaster('master_disconnected');
                        }

                        // Notify all clients
                        io.emit('uav_disconnected', {
                            uavId,
                            isMaster: currentMasterId === uavId,
                            currentMasterId,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            } else {
                console.log(`Client disconnected: ${socket.id}`);
            }
        });

        // Handle errors
        socket.on('error', (error) => {
            console.error(`Socket error (${socket.id}):`, error);
        });
    });

    // Clean up on server shutdown
    const cleanup = () => {
        clearInterval(cleanupInterval);
        if (masterRotationInterval) {
            clearInterval(masterRotationInterval);
            masterRotationInterval = null;
        }
        console.log('🧹 Cleaning up WebSocket handler');
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    // Broadcast functions for use by other parts of the application
    io.broadcastSurvivorDetected = (survivorData) => {
        io.emit('survivor_detected', {
            ...survivorData,
            timestamp: new Date().toISOString()
        });
    };

    io.broadcastISACModeChanged = (isacData) => {
        io.emit('isac_mode_changed', {
            ...isacData,
            timestamp: new Date().toISOString()
        });
    };

    io.broadcastUAVDataUpdate = (uavData) => {
        io.emit('uav_data_update', {
            ...uavData,
            timestamp: new Date().toISOString()
        });
    };

    io.broadcastSurvivorRescued = (survivorData) => {
        io.emit('survivor_rescued', {
            ...survivorData,
            timestamp: new Date().toISOString()
        });
    };

    io.broadcastMissionCompleted = (missionData) => {
        io.emit('mission_completed', {
            ...missionData,
            timestamp: new Date().toISOString()
        });
    };

    // Add a method to get all connected UAVs
    io.getConnectedUAVs = () => {
        return Array.from(connectedUAVs.values()).map(uav => ({
            id: uav.id,
            position: uav.position,
            battery: uav.battery,
            status: uav.status,
            lastSeen: uav.lastSeen
        }));
    };

    return io;
};

module.exports = socketHandler;