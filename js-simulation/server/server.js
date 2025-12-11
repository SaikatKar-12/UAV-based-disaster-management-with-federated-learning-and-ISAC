const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');

class SimulationServer {
    constructor(port = 3000) {
        this.port = port;
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.clients = new Map(); // Map of clientId -> WebSocket
        this.uavs = new Map();    // Map of uavId -> clientId

        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
    }

    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '../public')));
    }

    setupRoutes() {
        // Serve the dashboard
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../public/dashboard.html'));
        });

        // API to get current simulation status
        this.app.get('/api/status', (req, res) => {
            const status = {
                timestamp: new Date().toISOString(),
                uavs: Array.from(this.uavs.keys()).map(uavId => ({
                    id: uavId,
                    connected: true,
                    lastSeen: new Date().toISOString()
                })),
                connectedClients: this.clients.size
            };
            res.json(status);
        });
    }

    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            const clientId = req.headers['sec-websocket-key'] || Date.now().toString();
            console.log(`New client connected: ${clientId}`);
            
            this.clients.set(clientId, {
                ws,
                uavId: null,
                lastSeen: new Date()
            });

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleMessage(clientId, data);
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            });

            ws.on('close', () => {
                const client = this.clients.get(clientId);
                if (client && client.uavId) {
                    this.uavs.delete(client.uavId);
                    console.log(`UAV ${client.uavId} disconnected`);
                    this.broadcast({
                        type: 'uav_disconnected',
                        uavId: client.uavId,
                        timestamp: new Date().toISOString()
                    });
                }
                this.clients.delete(clientId);
            });

            // Send initial connection acknowledgment
            ws.send(JSON.stringify({
                type: 'connection_ack',
                clientId,
                timestamp: new Date().toISOString()
            }));
        });
    }

    handleMessage(clientId, data) {
        const client = this.clients.get(clientId);
        if (!client) return;

        client.lastSeen = new Date();

        switch (data.type) {
            case 'register_uav':
                this.registerUAV(clientId, data.uavId);
                break;
            
            case 'status_update':
                this.handleStatusUpdate(clientId, data);
                break;
            
            case 'command_response':
                this.broadcast({
                    type: 'command_response',
                    from: data.uavId,
                    commandId: data.commandId,
                    result: data.result,
                    timestamp: new Date().toISOString()
                }, data.target || 'all');
                break;
            
            default:
                console.log('Unknown message type:', data.type);
        }
    }

    registerUAV(clientId, uavId) {
        const client = this.clients.get(clientId);
        if (!client) return;

        // If this UAV was previously registered with another client, clean up
        if (this.uavs.has(uavId)) {
            const oldClientId = this.uavs.get(uavId);
            const oldClient = this.clients.get(oldClientId);
            if (oldClient) {
                oldClient.uavId = null;
            }
        }

        // Register the UAV with this client
        client.uavId = uavId;
        this.uavs.set(uavId, clientId);
        
        console.log(`Registered UAV ${uavId} with client ${clientId}`);
        
        // Acknowledge registration
        client.ws.send(JSON.stringify({
            type: 'registration_ack',
            uavId,
            timestamp: new Date().toISOString()
        }));

        // Notify all clients about the new UAV
        this.broadcast({
            type: 'uav_connected',
            uavId,
            timestamp: new Date().toISOString()
        });
    }

    handleStatusUpdate(clientId, data) {
        const client = this.clients.get(clientId);
        if (!client || !client.uavId) return;

        // Broadcast the status update to all clients
        this.broadcast({
            type: 'uav_status',
            uavId: client.uavId,
            position: data.position,
            velocity: data.velocity,
            battery: data.battery,
            status: data.status,
            timestamp: new Date().toISOString()
        });
    }

    sendCommand(uavId, command, params = {}) {
        const clientId = this.uavs.get(uavId);
        if (!clientId) {
            console.error(`No client found for UAV ${uavId}`);
            return false;
        }

        const client = this.clients.get(clientId);
        if (!client) {
            console.error(`Client ${clientId} not found`);
            return false;
        }

        const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        client.ws.send(JSON.stringify({
            type: 'command',
            commandId,
            command,
            params,
            timestamp: new Date().toISOString()
        }));

        return commandId;
    }

    broadcast(message, target = 'all') {
        const messageStr = JSON.stringify(message);
        
        if (target === 'all') {
            // Broadcast to all connected clients
            this.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(messageStr);
                }
            });
        } else if (this.uavs.has(target)) {
            // Send to a specific UAV
            const clientId = this.uavs.get(target);
            const client = this.clients.get(clientId);
            if (client && client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(messageStr);
            }
        }
    }

    async start() {
        return new Promise((resolve) => {
            this.server.listen(this.port, () => {
                console.log(`Simulation server running on port ${this.port}`);
                resolve();
            });
        });
    }

    async stop() {
        return new Promise((resolve) => {
            // Close all WebSocket connections
            this.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.close();
                }
            });

            // Close the HTTP server
            this.server.close(() => {
                console.log('Simulation server stopped');
                resolve();
            });
        });
    }
}

// If this file is run directly, start the server
if (require.main === module) {
    const server = new SimulationServer(3000);
    server.start().catch(console.error);
}

module.exports = { SimulationServer };
