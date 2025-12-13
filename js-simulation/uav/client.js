// g:\project_4thYear\js-simulation\uav\client.js
const io = require('socket.io-client');
const readline = require('readline');
const { v4: uuidv4 } = require('uuid');
const os = require('os');
const fs = require('fs');
const path = require('path');

class UAVClient {
  constructor(options = {}) {
    this.uavId = options.uavId || `uav-${uuidv4().substring(0, 6)}`;
    this.serverUrl = options.serverUrl || 'http://localhost:3000';
    this.position = options.position || [0, 0, 0]; // [x, y, z]
    this.velocity = options.velocity || [0, 0, 0]; // [vx, vy, vz]
    this.targetPosition = null; // Target position for movement
    this.arrivalThreshold = 0.5; // Distance threshold to consider target reached
    this.battery = options.battery || 100; // percentage
    this.status = 'disconnected';
    this.speed = options.speed || 2; // m/s (reduced for better control)
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000; // ms
    this.updateInterval = null;

    this.commandHandlers = {
      'takeoff': this.handleTakeoff.bind(this),
      'land': this.handleLand.bind(this),
      'move_to': this.handleMoveTo.bind(this),
      'set_velocity': this.handleSetVelocity.bind(this),
      'emergency_stop': this.handleEmergencyStop.bind(this)
    };
  }

  async connect() {
    return new Promise((resolve, reject) => {
      console.log(`[${this.uavId}] Connecting to server at ${this.serverUrl}...`);
      
      this.socket = io(this.serverUrl, {
        query: {
          uavId: this.uavId,
          type: 'uav'
        },
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay
      });

      this.socket.on('connect', () => {
        console.log(`[${this.uavId}] Connected to server`);
        this.status = 'connected';
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.registerWithServer();
        resolve();
      });

      this.socket.on('disconnect', () => {
        console.log(`[${this.uavId}] Disconnected from server`);
        this.status = 'disconnected';
        this.stopHeartbeat();
      });

      this.socket.on('connect_error', (error) => {
        console.error(`[${this.uavId}] Connection error:`, error.message);
        reject(error);
      });

      this.socket.on('command', (data) => {
        this.handleCommand(data);
      });
    });
  }

  registerWithServer() {
    this.socket.emit('register_uav', {
      uavId: this.uavId,
      position: this.position,
      battery: this.battery,
      status: this.status,
      capabilities: ['takeoff', 'land', 'move_to', 'set_velocity', 'emergency_stop']
    });
  }

  handleCommand(data) {
    const { command, params = {}, commandId } = data;
    console.log(`[${this.uavId}] Received command: ${command}`, params);

    // Handle the command and send response
    try {
      const handler = this.commandHandlers[command];
      if (!handler) {
        throw new Error(`Unknown command: ${command}`);
      }

      // Execute the command handler
      const result = handler(params);

      // Send success response
      this.socket.emit('command_response', {
        success: true,
        commandId,
        uavId: this.uavId,
        result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`[${this.uavId}] Error handling command:`, error);
      this.socket.emit('command_response', {
        success: false,
        commandId,
        uavId: this.uavId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  startHeartbeat() {
    this.updateInterval = setInterval(() => {
      this.updateStatus();
    }, 100); // Update status every 100ms

    // Send initial status
    this.updateStatus();
  }

  stopHeartbeat() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  updateStatus() {
    // Time step for smoother movement (in seconds)
    const timeStep = 0.1;
    
    // Only update position if we're moving
    if (this.status === 'moving_to_target' && this.targetPosition) {
      // Calculate distance to target
      const dx = this.targetPosition[0] - this.position[0];
      const dy = this.targetPosition[1] - this.position[1];
      const dz = this.targetPosition[2] - this.position[2];
      const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
      
      // If we're close to the target, stop
      if (distance < this.arrivalThreshold) {
        this.position = [...this.targetPosition];
        this.velocity = [0, 0, 0];
        this.status = 'hovering';
        this.targetPosition = null;
        console.log(`[${this.uavId}] Reached target position: [${this.position[0].toFixed(2)}, ${this.position[1].toFixed(2)}, ${this.position[2].toFixed(2)}]`);
      } else {
        // Update position based on velocity
        this.position[0] += this.velocity[0] * timeStep;
        this.position[1] += this.velocity[1] * timeStep;
        this.position[2] += this.velocity[2] * timeStep;
      }
    } else {
      // For other statuses, just update position based on velocity
      this.position[0] += this.velocity[0] * timeStep;
      this.position[1] += this.velocity[1] * timeStep;
      this.position[2] += this.velocity[2] * timeStep;
    }

    // Simulate battery drain (faster when moving), but more slowly overall
    // Previously: moving 0.1% per 100ms (3.6% per minute), idle 0.01% per 100ms
    // Now: moving 0.02% per 100ms (~0.72% per minute), idle 0.002% per 100ms
    const isMoving = this.velocity.some(v => Math.abs(v) > 0.1);
    const drainPerTick = isMoving ? 0.02 : 0.002;
    this.battery = Math.max(0, this.battery - drainPerTick);

    // Emit status update
    this.socket.emit('uav_status', {
      position: [...this.position],
      velocity: [...this.velocity],
      battery: this.battery,
      status: this.status
    });
  }

  // Send all images from js-simulation/images to backend
  async sendImagesToBase() {
    try {
      const imagesDir = path.join(__dirname, '..', 'images');
      if (!fs.existsSync(imagesDir)) {
        console.warn(`[${this.uavId}] Images directory does not exist: ${imagesDir}`);
        return { success: false, message: 'Images directory not found' };
      }

      const files = fs.readdirSync(imagesDir).filter(f =>
        f.toLowerCase().endsWith('.jpg') ||
        f.toLowerCase().endsWith('.jpeg') ||
        f.toLowerCase().endsWith('.png'));

      if (files.length === 0) {
        console.log(`[${this.uavId}] No image files found in ${imagesDir}`);
        return { success: false, message: 'No images to send' };
      }

      console.log(`[${this.uavId}] Sending ${files.length} images to base (frontend)...`);

      for (const file of files) {
        const fullPath = path.join(imagesDir, file);
        const buffer = fs.readFileSync(fullPath);
        const base64Data = buffer.toString('base64');

        const mimeType = file.toLowerCase().endsWith('.png')
          ? 'image/png'
          : 'image/jpeg';

        // Send image for direct frontend consumption via backend relay
        this.socket.emit('master_image', {
          uavId: this.uavId,
          fileName: file,
          mimeType,
          data: base64Data,
          timestamp: new Date().toISOString()
        });

        console.log(`[${this.uavId}] Sent image: ${file}`);
      }

      return { success: true, count: files.length };
    } catch (error) {
      console.error(`[${this.uavId}] Failed to send images:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // Command handlers
  handleTakeoff(params) {
    console.log(`[${this.uavId}] Taking off to altitude: ${params.altitude || 10}m`);
    this.status = 'taking_off';
    this.velocity[2] = 1; // Start moving up
    return { altitude: params.altitude || 10 };
  }

  handleLand() {
    console.log(`[${this.uavId}] Landing...`);
    this.status = 'landing';
    this.velocity = [0, 0, -1]; // Start moving down
    return { message: 'Landing initiated' };
  }

  handleMoveTo(params) {
    const { x, y, z } = params;
    if (x === undefined || y === undefined || z === undefined) {
      throw new Error('Missing required parameters: x, y, z');
    }

    console.log(`[${this.uavId}] Moving to position: [${x}, ${y}, ${z}]`);
    this.targetPosition = [x, y, z];
    this.status = 'moving_to_target';
    
    // Calculate direction vector
    const dx = x - this.position[0];
    const dy = y - this.position[1];
    const dz = z - this.position[2];
    const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
    
    if (distance > this.arrivalThreshold) {
      // Calculate velocity vector (direction * speed)
      const direction = [dx/distance, dy/distance, dz/distance];
      this.velocity = [
        direction[0] * this.speed,
        direction[1] * this.speed,
        direction[2] * this.speed
      ];
    } else {
      // Already at or very close to target
      this.velocity = [0, 0, 0];
      this.status = 'hovering';
      console.log(`[${this.uavId}] Reached target position: [${x}, ${y}, ${z}]`);
    }

    return { target: [x, y, z], speed: this.speed };
  }

  handleSetVelocity(params) {
    const { vx, vy, vz } = params;
    if (vx === undefined || vy === undefined || vz === undefined) {
      throw new Error('Missing required parameters: vx, vy, vz');
    }

    console.log(`[${this.uavId}] Setting velocity: [${vx}, ${vy}, ${vz}]`);
    this.status = 'manual_control';
    this.velocity = [vx, vy, vz];
    return { velocity: this.velocity };
  }

  handleEmergencyStop() {
    console.log(`[${this.uavId}] EMERGENCY STOP!`);
    this.velocity = [0, 0, 0];
    this.targetPosition = null;
    this.status = 'emergency_stop';
    return { message: 'Emergency stop activated' };
  }

  disconnect() {
    console.log(`[${this.uavId}] Disconnecting...`);
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

// Command Line Interface
function setupCLI(uav) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `UAV-${uav.uavId}> `
  });

  rl.prompt();

  rl.on('line', (line) => {
    const [command, ...args] = line.trim().split(' ');
    
    switch (command.toLowerCase()) {
      case 'takeoff':
        uav.handleTakeoff({ altitude: parseFloat(args[0]) || 10 });
        break;
        
      case 'land':
        uav.handleLand();
        break;
        
      case 'move':
        if (args.length >= 3) {
          uav.handleMoveTo({
            x: parseFloat(args[0]),
            y: parseFloat(args[1]),
            z: parseFloat(args[2])
          });
        } else {
          console.log('Usage: move <x> <y> <z>');
        }
        break;
        
      case 'velocity':
        if (args.length >= 3) {
          uav.handleSetVelocity({
            vx: parseFloat(args[0]),
            vy: parseFloat(args[1]),
            vz: parseFloat(args[2])
          });
        } else {
          console.log('Usage: velocity <vx> <vy> <vz>');
        }
        break;
        
      case 'stop':
        uav.handleEmergencyStop();
        break;
        
      case 'status':
        console.log(`Status: ${uav.status}`);
        console.log(`Position: [${uav.position.join(', ')}]`);
        console.log(`Velocity: [${uav.velocity.join(', ')}]`);
        console.log(`Battery: ${uav.battery.toFixed(2)}%`);
        break;
        
      case 'send_images':
        // Master UAV: send collected images/data to base
        uav.sendImagesToBase();
        break;
        
      case 'help':
        console.log('Available commands:');
        console.log('  takeoff [altitude] - Take off to specified altitude (default: 10m)');
        console.log('  land               - Land at current position');
        console.log('  move x y z         - Move to specified coordinates');
        console.log('  velocity vx vy vz  - Set velocity vector');
        console.log('  stop               - Emergency stop (hover in place)');
        console.log('  status             - Show current status');
        console.log('  help               - Show this help message');
        console.log('  exit               - Disconnect and exit');
        break;
        
      case 'exit':
        rl.close();
        break;
        
      default:
        console.log(`Unknown command: ${command}. Type 'help' for a list of commands.`);
    }
    
    rl.prompt();
  }).on('close', () => {
    console.log('Disconnecting from server...');
    uav.disconnect();
    process.exit(0);
  });
}

// Main function
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {
    uavId: 'uav-1',
    position: [0, 0, 0]
  };

  // Simple argument parsing
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--id' && args[i + 1]) {
      options.uavId = args[++i];
    } else if (args[i] === '--server' && args[i + 1]) {
      options.serverUrl = args[++i];
    } else if (args[i] === '--x' && args[i + 1]) {
      options.position[0] = parseFloat(args[++i]);
    } else if (args[i] === '--y' && args[i + 1]) {
      options.position[1] = parseFloat(args[++i]);
    } else if (args[i] === '--z' && args[i + 1]) {
      options.position[2] = parseFloat(args[++i]);
    }
  }

  console.log(`Starting UAV ${options.uavId}...`);
  console.log(`Connecting to server: ${options.serverUrl}`);
  console.log(`Initial position: [${options.position.join(', ')}]`);
  console.log('Press Ctrl+C to exit\n');

  const uav = new UAVClient(options);

  try {
    await uav.connect();
    setupCLI(uav);
  } catch (error) {
    console.error('Failed to start UAV:', error.message);
    process.exit(1);
  }

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    uav.disconnect();
    process.exit(0);
  });
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { UAVClient };