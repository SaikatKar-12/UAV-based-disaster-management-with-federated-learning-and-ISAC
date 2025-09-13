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
        
        // Initialize UAVs
        this.uavs = this.initializeUAVs();
        
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
            // Update environmental conditions
            this.environment = updateEnvironment(this.environment, this.currentTime);
            
            // Process each UAV
            for (let i = 0; i < this.uavs.length; i++) {
                const uav = this.uavs[i];
                
                // Update UAV position and movement
                this.uavs[i] = updateUAVPosition(uav, this.config.dt);
                
                // Simulate battery drain
                this.uavs[i].batteryLevel = Math.max(0, this.uavs[i].batteryLevel - (0.1 * this.config.dt));
                
                // Determine ISAC mode based on current conditions and target
                const isacResult = this.determineUAVISACMode(this.uavs[i], this.baseStation.position, this.environment);
                
                // Simulate UAV sensor data collection
                const sensorData = simulateSensorData(this.uavs[i], this.environment, this.currentTime);
                
                // Process and filter data based on ISAC mode
                const transmissionData = simulateDataTransmission(sensorData, isacResult.isacMode);
                
                // Prepare complete data package
                const uavData = this.prepareUAVData(this.uavs[i], isacResult, transmissionData, sensorData);
                
                // Send data to backend (if available) or log locally
                this.sendDataToBackend(uavData);
                
                // Display current status
                this.displayUAVStatus(this.uavs[i], isacResult, transmissionData.dataSizeBytes);
            }
            
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
     * Initialize multiple UAVs
     * @returns {Array} Array of UAV objects
     */
    initializeUAVs() {
        const uavs = [
            {
                id: 'UAV-001',
                position: [100, 100, 50], // [x, y, altitude]
                velocity: [8, 3, 0], // [vx, vy, vz]
                batteryLevel: 95,
                cameraActive: true,
                aiModelVersion: '1.0',
                patternState: null,
                targetSignalStrength: 85, // Target for good signal
                isacMode: 'good'
            },
            {
                id: 'UAV-002',
                position: [300, 200, 45], // Different starting position
                velocity: [6, -4, 0.5], // Different velocity pattern
                batteryLevel: 78,
                cameraActive: true,
                aiModelVersion: '1.0',
                patternState: null,
                targetSignalStrength: 60, // Target for medium signal
                isacMode: 'medium'
            },
            {
                id: 'UAV-003',
                position: [-100, 150, 55], // Different starting position
                velocity: [-5, 2, -0.3], // Different velocity pattern
                batteryLevel: 42,
                cameraActive: true,
                aiModelVersion: '1.0',
                patternState: null,
                targetSignalStrength: 25, // Target for weak signal
                isacMode: 'weak'
            }
        ];
        
        uavs.forEach(uav => {
            console.log(`${uav.id} initialized at position [${uav.position.join(', ')}] - ${uav.isacMode} signal`);
        });
        
        return uavs;
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
     * Determine ISAC mode for specific UAV based on target signal strength
     * @param {Object} uav - UAV object
     * @param {Array} baseStationPos - Base station position
     * @param {Object} environment - Environment object
     * @returns {Object} ISAC result
     */
    determineUAVISACMode(uav, baseStationPos, environment) {
        // Calculate distance-based signal strength with some variation
        const distance = Math.sqrt(
            Math.pow(uav.position[0] - baseStationPos[0], 2) + 
            Math.pow(uav.position[1] - baseStationPos[1], 2)
        );
        
        // Add some realistic variation around target signal strength
        const variation = (Math.random() - 0.5) * 20; // ±10% variation
        let signalStrength = uav.targetSignalStrength + variation;
        
        // Ensure signal strength stays within reasonable bounds
        signalStrength = Math.max(10, Math.min(95, signalStrength));
        
        // Determine mode based on signal strength
        let isacMode = 'weak';
        let dataRate = 10;
        
        if (signalStrength >= 70) {
            isacMode = 'good';
            dataRate = 45 + (signalStrength - 70) * 0.5;
        } else if (signalStrength >= 45) {
            isacMode = 'medium';
            dataRate = 25 + (signalStrength - 45) * 0.8;
        } else {
            isacMode = 'weak';
            dataRate = 10 + signalStrength * 0.3;
        }
        
        return {
            isacMode,
            signalStrength,
            dataRate: Math.round(dataRate * 10) / 10,
            distance
        };
    }

    /**
     * Prepare complete UAV data package
     * @param {Object} uav - UAV object
     * @param {Object} isacResult - ISAC mode determination result
     * @param {Object} transmissionData - Filtered transmission data
     * @param {Object} sensorData - Raw sensor data
     * @returns {Object} Complete UAV data package
     */
    prepareUAVData(uav, isacResult, transmissionData, sensorData) {
        return {
            timestamp: new Date().toISOString(),
            uavId: uav.id,
            location: {
                lat: this.convertToLatLng(uav.position[0], 'lat'),
                lng: this.convertToLatLng(uav.position[1], 'lng'),
                altitude: uav.position[2]
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
                batteryLevel: uav.batteryLevel,
                cameraActive: uav.cameraActive,
                aiModelVersion: uav.aiModelVersion
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
     * Display current UAV status
     * @param {Object} uav - UAV object
     * @param {Object} isacResult - ISAC mode determination result
     * @param {number} dataSizeBytes - Size of transmitted data in bytes
     */
    displayUAVStatus(uav, isacResult, dataSizeBytes) {
        const statusSymbol = '✓'; // Always success in simulation
        
        console.log(
            `[${this.currentTime.toString().padStart(6, ' ')}s] ` +
            `${uav.id}: [${uav.position[0].toFixed(1).padStart(6, ' ')}, ${uav.position[1].toFixed(1).padStart(6, ' ')}, ${uav.position[2].toFixed(1).padStart(4, ' ')}] | ` +
            `ISAC: ${isacResult.isacMode.toUpperCase().padEnd(6, ' ')} | ` +
            `Signal: ${isacResult.signalStrength.toFixed(1).padStart(5, ' ')}% | ` +
            `Battery: ${uav.batteryLevel.toFixed(1).padStart(5, ' ')}% | ` +
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
        // Base coordinates (example: Kolkata, India)
        const baseLat = 22.5726;
        const baseLng = 88.3639;
        
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
            uavs: this.uavs ? this.uavs.map(uav => ({
                id: uav.id,
                position: [...uav.position],
                batteryLevel: uav.batteryLevel,
                isacMode: uav.isacMode
            })) : []
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