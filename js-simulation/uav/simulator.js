const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

class UAVSimulator {
    constructor(uavId, options = {}) {
        this.uavId = uavId || `uav-${uuidv4()}`;
        this.position = options.position || [0, 0, 0];  // x, y, z
        this.velocity = options.velocity || [0, 0, 0];  // vx, vy, vz
        this.battery = options.battery || 100;          // percentage
        this.status = options.status || 'idle';         // idle, taking_off, hovering, moving, landing, emergency
        this.speed = options.speed || 10;               // m/s
        this.updateInterval = null;
        this.ws = null;
        this.serverUrl = options.serverUrl || 'ws://localhost:3000';
        this.connected = false;
        this.commandHandlers = new Map();
    }

    async connect() {
        return new Promise((resolve, reject) => {
            console.log(`Connecting to simulation server at ${this.serverUrl}...`);
            
            this.ws = new WebSocket(this.serverUrl);
            
            this.ws.on('open', () => {
                console.log(`Connected to simulation server as ${this.uavId}`);
                this.connected = true;
                
                // Register this UAV with the server
                this.send({
                    type: 'register_uav',
                    uavId: this.uavId
                });
                
                // Start sending status updates
                this.startStatusUpdates();
                
                resolve();
            });
            
            this.ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            });
            
            this.ws.on('close', () => {
                console.log('Disconnected from simulation server');
                this.connected = false;
                this.stopStatusUpdates();
                this.ws = null;
            });
            
            this.ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                reject(error);
            });
        });
    }

    send(message) {
        if (this.connected && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
            return true;
        }
        return false;
    }

    handleMessage(message) {
        switch (message.type) {
            case 'registration_ack':
                console.log(`Successfully registered as UAV ${message.uavId}`);
                break;
                
            case 'command':
                this.handleCommand(message);
                break;
                
            default:
                console.log('Received message:', message);
        }
    }

    async handleCommand(message) {
        const { command, params = {}, commandId } = message;
        console.log(`Received command: ${command}`, params);
        
        let result;
        try {
            switch (command) {
                case 'takeoff':
                    result = await this.takeoff(params.altitude);
                    break;
                    
                case 'land':
                    result = await this.land();
                    break;
                    
                case 'move_to':
                    result = await this.moveTo(params.x, params.y, params.z);
                    break;
                    
                case 'set_velocity':
                    this.setVelocity(params.vx, params.vy, params.vz);
                    result = { success: true };
                    break;
                    
                case 'emergency_stop':
                    result = await this.emergencyStop();
                    break;
                    
                default:
                    result = { error: `Unknown command: ${command}` };
            }
        } catch (error) {
            console.error(`Error executing command ${command}:`, error);
            result = { error: error.message };
        }
        
        // Send command response
        this.send({
            type: 'command_response',
            commandId,
            result,
            timestamp: new Date().toISOString()
        });
    }

    startStatusUpdates(interval = 1000) {
        this.stopStatusUpdates();
        
        // Send initial status
        this.sendStatus();
        
        // Set up periodic updates
        this.updateInterval = setInterval(() => {
            this.sendStatus();
        }, interval);
        
        console.log('Started status updates');
    }

    stopStatusUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            console.log('Stopped status updates');
        }
    }

    sendStatus() {
        if (!this.connected) return false;
        
        return this.send({
            type: 'status_update',
            uavId: this.uavId,
            position: [...this.position],
            velocity: [...this.velocity],
            battery: this.battery,
            status: this.status,
            timestamp: new Date().toISOString()
        });
    }

    async takeoff(altitude = 100) {
        if (this.status !== 'idle' && this.status !== 'landed') {
            throw new Error(`Cannot take off: UAV is ${this.status}`);
        }
        
        this.status = 'taking_off';
        console.log(`Taking off to ${altitude}m...`);
        
        // Simulate takeoff time (5 seconds to reach altitude)
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        this.position[2] = altitude;
        this.status = 'hovering';
        console.log(`Reached altitude ${altitude}m`);
        
        return { success: true, altitude };
    }

    async land() {
        if (this.status === 'landed' || this.status === 'landing') {
            return { success: true, alreadyLanded: true };
        }
        
        this.status = 'landing';
        console.log('Initiating landing sequence...');
        
        // Simulate landing time (5 seconds to land)
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        this.position[2] = 0;
        this.velocity = [0, 0, 0];
        this.status = 'landed';
        console.log('Successfully landed');
        
        return { success: true };
    }

    async moveTo(x, y, z = null) {
        if (z === null) {
            z = this.position[2]; // Maintain current altitude if not specified
        }
        
        if (this.status !== 'hovering' && this.status !== 'moving') {
            throw new Error(`Cannot move: UAV is ${this.status}`);
        }
        
        console.log(`Moving to [${x}, ${y}, ${z}]...`);
        this.status = 'moving';
        
        // Calculate distance and time to target
        const dx = x - this.position[0];
        const dy = y - this.position[1];
        const dz = z - this.position[2];
        const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
        const timeToTarget = distance / this.speed;
        
        if (distance === 0) {
            this.status = 'hovering';
            return { success: true, position: [...this.position] };
        }
        
        // Calculate velocity vector
        this.velocity = [
            dx / timeToTarget,
            dy / timeToTarget,
            dz / timeToTarget
        ];
        
        // Simulate movement
        await new Promise(resolve => {
            setTimeout(() => {
                this.position = [x, y, z];
                this.velocity = [0, 0, 0];
                this.status = 'hovering';
                console.log(`Reached target position [${x}, ${y}, ${z}]`);
                resolve();
            }, timeToTarget * 1000);
        });
        
        return { success: true, position: [...this.position] };
    }

    setVelocity(vx, vy, vz = 0) {
        this.velocity = [vx, vy, vz];
        this.status = 'moving';
        console.log(`Set velocity to [${vx}, ${vy}, ${vz}] m/s`);
        return { success: true, velocity: [...this.velocity] };
    }

    async emergencyStop() {
        console.log('EMERGENCY STOP ACTIVATED');
        this.velocity = [0, 0, 0];
        
        if (this.position[2] > 0) {
            // If in the air, initiate emergency landing
            return this.land();
        } else {
            // If on the ground, just stop
            this.status = 'idle';
            return { success: true, action: 'stopped' };
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
        this.stopStatusUpdates();
        this.connected = false;
    }
}

// If this file is run directly, start a test UAV
if (require.main === module) {
    const uav = new UAVSimulator();
    
    // Handle command line arguments
    const args = process.argv.slice(2);
    const serverUrl = args[0] || 'ws://localhost:3000';
    const uavId = args[1] || `uav-${Math.floor(Math.random() * 1000)}`;
    
    console.log(`Starting UAV ${uavId} connecting to ${serverUrl}`);
    
    uav.serverUrl = serverUrl;
    uav.uavId = uavId;
    
    uav.connect().catch(console.error);
    
    // Handle process termination
    process.on('SIGINT', async () => {
        console.log('\nShutting down UAV...');
        await uav.land();
        uav.disconnect();
        process.exit(0);
    });
}

module.exports = { UAVSimulator };
