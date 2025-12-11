/**
 * WebSocket Event Handler
 * Manages real-time communication with UAVs and frontend clients
 */

const { v4: uuidv4 } = require('uuid');

// Store connected UAVs and their data
const connectedUAVs = new Map();

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
                    reason: 'timeout',
                    timestamp: new Date().toISOString()
                });
            }
        });

        if (cleaned > 0) {
            console.log(`🧹 Cleaned up ${cleaned} inactive UAVs`);
        }
    }, 60000); // Check every minute

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
                    battery: data.battery || 100
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

            // Broadcast status to all clients
            io.emit('uav_status_update', {
                uavId,
                position: uav.position,
                velocity: uav.velocity,
                battery: uav.battery,
                status: uav.status,
                timestamp: new Date().toISOString()
            });

            if (typeof callback === 'function') {
                callback({ success: true });
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
                        
                        // Notify all clients
                        io.emit('uav_disconnected', { 
                            uavId,
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