/**
 * WebSocket Event Handler
 * Manages real-time communication with frontend clients
 */

const socketHandler = (io) => {
    console.log('WebSocket handler initialized');

    io.on('connection', (socket) => {
        console.log(`✅ Client connected: ${socket.id}`);

        // Send welcome message
        socket.emit('connected', {
            message: 'Connected to UAV Disaster Response System',
            timestamp: new Date().toISOString()
        });

        // Handle client events
        socket.on('join_room', (data) => {
            const { room } = data;
            socket.join(room);
            console.log(`Client ${socket.id} joined room: ${room}`);
        });

        socket.on('leave_room', (data) => {
            const { room } = data;
            socket.leave(room);
            console.log(`Client ${socket.id} left room: ${room}`);
        });

        // Handle client requests for data
        socket.on('request_uav_status', () => {
            // In a real implementation, fetch current UAV status and emit it
            socket.emit('uav_status_update', {
                message: 'UAV status requested',
                timestamp: new Date().toISOString()
            });
        });

        socket.on('request_survivors', () => {
            // In a real implementation, fetch current survivors and emit them
            socket.emit('survivors_update', {
                message: 'Survivors data requested',
                timestamp: new Date().toISOString()
            });
        });

        // Handle disconnection
        socket.on('disconnect', (reason) => {
            console.log(`❌ Client disconnected: ${socket.id}, reason: ${reason}`);
        });

        // Handle errors
        socket.on('error', (error) => {
            console.error(`WebSocket error for client ${socket.id}:`, error);
        });
    });

    // Broadcast functions for use by other parts of the application
    io.broadcastSurvivorDetected = (survivorData) => {
        io.emit('survivor_detected', survivorData);
    };

    io.broadcastISACModeChanged = (isacData) => {
        io.emit('isac_mode_changed', isacData);
    };

    io.broadcastUAVDataUpdate = (uavData) => {
        io.emit('uav_data_update', uavData);
    };

    io.broadcastSurvivorRescued = (survivorData) => {
        io.emit('survivor_rescued', survivorData);
    };

    io.broadcastMissionCompleted = (missionData) => {
        io.emit('mission_completed', missionData);
    };

    return io;
};

module.exports = socketHandler;