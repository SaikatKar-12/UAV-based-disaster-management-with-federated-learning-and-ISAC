/**
 * UAV-Based Disaster Response System - Main Simulation
 * JavaScript version converted from MATLAB
 * This script runs the complete ISAC simulation for UAV disaster response
 */

const SimulationConfig = require('./config/simulationConfig');
const { determineISACMode } = require('./isac/determineISACMode');
const { simulateDataTransmission } = require('./isac/simulateDataTransmission');
const { updateUAVPosition } = require('./uav/simulateUAVMovement');
const { simulateSensorData } = require('./uav/simulateSensorData');
const { updateEnvironment, initializeEnvironment } = require('./environment/simulateEnvironment');

class UAVSimulator {
    constructor() {
        this.config = new SimulationConfig();
        this.isRunning = false;
        this.currentTime = 0;
        this.intervalId = null;
        
        // Initialize simulation components
        this.environment = null;
        this.uav = null;
        this.baseStation = null;
        
        console.log('=== UAV Disaster Response ISAC Simulation ===');
        console.log('JavaScript version - Starting simulation...\n');
    }
    
    /**
     * Start the simulation
     */
    start() {
        if (this.isRunning) {
            console.log('Simulation is already running');
            return;
        }
        
        // Initialize simulation environment
        this.environment = this.initializeEnvironment();
        
        // Initialize UAV
        this.uav = this.initializeUAV();
        
        // Initialize base station
        this.baseStation = this.initializeBaseStation();
        
        // Start simulation loop
        this.isRunning = true;
        this.currentTime = 0;
        this.runSimulationLoop();
        
        console.log(`Running simulation for ${this.config.simulationTime} seconds...\n`);
    }
    
    /**
     * Stop the simulation
     */
    stop() {
        this.isRunning = false;
        if (this.intervalId) {
            clearTimeout(this.intervalId);
            this.intervalId = null;
        }
        console.log('\nSimulation stopped by user');
    }
    
    /**
     * Main simulation loop
     */
    runSimulationLoop() {
        if (!this.isRunning || this.currentTime >= this.config.simulationTime) {
            this.isRunning = false;
            console.log('\nSimulation completed successfully!');
            return;
        }
        
        try {
            // Update UAV position and movement
            this.uav = updateUAVPosition(this.uav, this.config.dt);
            
            // Update environmental conditions
            this.environment = updateEnvironment(this.environment, this.currentTime);
            
            // Determine ISAC mode based on current conditions
            const isacResult = determineISACMode(
                this.uav.position, 
                this.baseStation.position, 
                this.environment
            );
            
            // Simulate UAV sensor data collection
            const sensorData = simulateSensorData(this.uav, this.environment, this.currentTime);
            
            // Process and filter data based on ISAC mode
            const transmissionData = simulateDataTransmission(sensorData, isacResult.isacMode);
            
            // Prepare complete data package
            const uavData = this.prepareUAVData(isacResult, transmissionData, sensorData);
            
            // Send data to backend (if available) or log locally
            this.sendDataToBackend(uavData);
            
            // Display current status
            this.displayStatus(isacResult, transmissionData.dataSizeBytes);
            
            // Update simulation time
            this.currentTime += this.config.dt;
            
            // Schedule next iteration
            if (this.config.realTime) {
                this.intervalId = setTimeout(() => this.runSimulationLoop(), this.config.dt * 1000);
            } else {
                // Run as fast as possible
                setImmediate(() => this.runSimulationLoop());
            }
            
        } catch (error) {
            console.error('Error in simulation loop:', error);
            this.stop();
        }
    }
    
    /**
     * Initialize simulation environment
     * @returns {Object} Environment object
     */
    initializeEnvironment() {
        const environment = initializeEnvironment();
        return environment;
    }
    
    /**
     * Initialize UAV
     * @returns {Object} UAV object
     */
    initializeUAV() {
        const uav = {
            id: 'UAV-001',
            position: [...this.config.uavStartPosition], // [x, y, altitude]
            velocity: [...this.config.uavVelocity], // [vx, vy, vz]
            batteryLevel: 100, // percentage
            cameraActive: true,
            aiModelVersion: '1.0',
            patternState: null // Will be initialized by movement functions
        };
        
        console.log(`UAV initialized at position [${uav.position.join(', ')}]`);
        return uav;
    }
    
    /**
     * Initialize base station
     * @returns {Object} Base station object
     */
    initializeBaseStation() {
        const baseStation = {
            position: [...this.config.baseStationPosition], // [x, y]
            transmissionPower: 20, // dBm
            frequency: 2.4e9 // 2.4 GHz
        };
        
        console.log(`Base station initialized at position [${baseStation.position.join(', ')}]`);
        return baseStation;
    }
    
    /**
     * Prepare complete UAV data package
     * @param {Object} isacResult - ISAC mode determination result
     * @param {Object} transmissionData - Filtered transmission data
     * @param {Object} sensorData - Raw sensor data
     * @returns {Object} Complete UAV data package
     */
    prepareUAVData(isacResult, transmissionData, sensorData) {
        return {
            timestamp: new Date().toISOString(),
            uavId: this.uav.id,
            location: {
                lat: this.convertToLatLng(this.uav.position[0], 'lat'),
                lng: this.convertToLatLng(this.uav.position[1], 'lng'),
                altitude: this.uav.position[2]
            },
            isacMode: isacResult.isacMode,
            signalStrength: isacResult.signalStrength,
            dataRate: isacResult.dataRate,
            detections: transmissionData.detections || [],
            videoStream: transmissionData.videoStream || null,
            modelUpdates: transmissionData.modelUpdates || null,
            telemetry: transmissionData.telemetry || sensorData.telemetry,
            dataSizeBytes: transmissionData.dataSizeBytes,
            transmissionMode: transmissionData.isacMode,
            uavStatus: {
                batteryLevel: this.uav.batteryLevel,
                cameraActive: this.uav.cameraActive,
                aiModelVersion: this.uav.aiModelVersion
            },
            environmentalData: transmissionData.environmentalData || null
        };
    }
    
    /**
     * Send data to backend server or handle locally
     * @param {Object} uavData - Complete UAV data package
     */
    async sendDataToBackend(uavData) {
        try {
            // Attempt to send to backend
            const fetch = require('node-fetch');
            const response = await fetch(`${this.config.backendUrl}/api/uav/data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(uavData),
                timeout: this.config.apiTimeout
            });
            
            if (response.ok) {
                const result = await response.json();
                // Successfully sent to backend
                if (result.processed && result.processed.detections > 0) {
                    console.log(`      -> Backend processed ${result.processed.detections} detection(s)`);
                }
                return true;
            } else {
                console.log(`      -> Backend error: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            // Backend not available - continue simulation locally
            if (error.code === 'ECONNREFUSED') {
                console.log('      -> Backend not available (start with: cd backend && npm start)');
            } else {
                console.log(`      -> Backend error: ${error.message}`);
            }
        }
        
        // Handle data locally (for demonstration)
        this.handleDataLocally(uavData);
        return false;
    }
    
    /**
     * Handle UAV data locally when backend is not available
     * @param {Object} uavData - UAV data package
     */
    handleDataLocally(uavData) {
        // Log detections
        if (uavData.detections && uavData.detections.length > 0) {
            uavData.detections.forEach(detection => {
                console.log(`      -> Survivor detected: ID=${detection.id}, Confidence=${(detection.confidence * 100).toFixed(1)}%`);
            });
        }
        
        // Log significant events
        if (uavData.uavStatus.batteryLevel < 30) {
            console.log(`      -> Warning: Low battery (${uavData.uavStatus.batteryLevel.toFixed(1)}%)`);
        }
    }
    
    /**
     * Display current simulation status
     * @param {Object} isacResult - ISAC mode determination result
     * @param {number} dataSizeBytes - Size of transmitted data in bytes
     */
    displayStatus(isacResult, dataSizeBytes) {
        const statusSymbol = '✓'; // Always success in simulation
        
        console.log(
            `[${this.currentTime.toString().padStart(6, ' ')}s] ` +
            `UAV: [${this.uav.position[0].toFixed(1).padStart(6, ' ')}, ${this.uav.position[1].toFixed(1).padStart(6, ' ')}] | ` +
            `ISAC: ${isacResult.isacMode.toUpperCase().padEnd(6, ' ')} | ` +
            `Signal: ${isacResult.signalStrength.toFixed(1).padStart(5, ' ')}% | ` +
            `TX: ${statusSymbol}`
        );
    }
    
    /**
     * Convert local coordinates to GPS coordinates
     * @param {number} positionM - Position in meters
     * @param {string} coordType - 'lat' or 'lng'
     * @returns {number} GPS coordinate
     */
    convertToLatLng(positionM, coordType) {
        // Base coordinates (example: Bangalore, India)
        const baseLat = 12.9716;
        const baseLng = 77.5946;
        
        // Approximate conversion (1 degree ≈ 111 km)
        const metersPerDegree = 111000;
        
        switch (coordType) {
            case 'lat':
                return baseLat + (positionM / metersPerDegree);
            case 'lng':
                return baseLng + (positionM / (metersPerDegree * Math.cos(baseLat * Math.PI / 180)));
            default:
                return 0;
        }
    }
    
    /**
     * Get current simulation status
     * @returns {Object} Simulation status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            currentTime: this.currentTime,
            totalTime: this.config.simulationTime,
            progress: (this.currentTime / this.config.simulationTime) * 100,
            uavPosition: this.uav ? [...this.uav.position] : null,
            batteryLevel: this.uav ? this.uav.batteryLevel : null
        };
    }
}

/**
 * Main function to run the simulation
 */
function main() {
    const simulator = new UAVSimulator();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\nReceived SIGINT, stopping simulation...');
        simulator.stop();
        process.exit(0);
    });
    
    // Start the simulation
    simulator.start();
    
    return simulator;
}

// Export for use as module or run directly
module.exports = { UAVSimulator, main };

// Run simulation if this file is executed directly
if (require.main === module) {
    main();
}