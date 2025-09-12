/**
 * Simulation Configuration
 * Configuration parameters for UAV disaster response simulation
 */

class SimulationConfig {
    constructor() {
        // Simulation timing
        this.simulationTime = 300; // Total simulation time in seconds (5 minutes)
        this.dt = 2; // Time step in seconds
        this.realTime = true; // Run in real-time or as fast as possible
        
        // Backend server configuration
        this.backendUrl = 'http://localhost:3000'; // Node.js backend URL
        this.apiTimeout = 10000; // HTTP request timeout in milliseconds
        
        // UAV configuration
        this.uavStartPosition = [100, 100, 50]; // [x, y, altitude] in meters
        this.uavVelocity = [8, 3, 0]; // [vx, vy, vz] in m/s
        this.uavMaxSpeed = 15; // Maximum speed in m/s
        this.uavSearchPattern = 'spiral'; // 'linear', 'spiral', 'random'
        
        // Base station configuration
        this.baseStationPosition = [0, 0]; // [x, y] in meters
        
        // ISAC thresholds
        this.isacThresholds = {
            goodMin: 75, // Minimum signal strength for 'good' mode
            mediumMin: 40 // Minimum signal strength for 'medium' mode
        };
        
        // Network parameters
        this.network = {
            frequency: 2.4e9, // 2.4 GHz
            txPower: 20, // Transmission power in dBm
            antennaGain: 3, // Antenna gain in dBi
            noiseFloor: -90 // Noise floor in dBm
        };
        
        // Environment parameters
        this.environment = {
            terrainLoss: 2, // Additional path loss due to terrain (dB)
            buildingDensity: 0.3, // Probability of buildings in path
            weatherVariability: true // Enable weather effects
        };
        
        // Survivor detection parameters
        this.detection = {
            probability: 0.15, // Probability of detecting survivor per time step
            falsePositiveRate: 0.05, // False positive detection rate
            confidenceRange: [0.6, 0.95] // Range of detection confidence
        };
        
        // Data transmission parameters
        this.transmission = {
            videoQualityGood: 1080, // Video resolution for good mode
            videoQualityMedium: 480, // Video resolution for medium mode
            compressionRatio: 0.3 // Video compression ratio for medium mode
        };
        
        console.log('Simulation configuration loaded:');
        console.log(`  Duration: ${this.simulationTime} seconds`);
        console.log(`  Time step: ${this.dt} seconds`);
        console.log(`  Backend URL: ${this.backendUrl}`);
        console.log(`  UAV start position: [${this.uavStartPosition.join(', ')}]`);
    }
}

module.exports = SimulationConfig;