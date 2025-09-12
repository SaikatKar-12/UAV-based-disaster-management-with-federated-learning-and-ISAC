/**
 * ISAC Mode Determination
 * Determines the optimal ISAC communication mode based on signal conditions
 */

const { calculatePathLoss } = require('./calculatePathLoss');

/**
 * Determine ISAC mode based on UAV position and environmental conditions
 * @param {Array} uavPosition - [x, y, altitude] in meters
 * @param {Array} baseStationPos - [x, y] in meters
 * @param {Object} environment - Environmental conditions
 * @returns {Object} {isacMode, signalStrength, dataRate}
 */
function determineISACMode(uavPosition, baseStationPos, environment) {
    // Calculate distance between UAV and base station
    const dx = uavPosition[0] - baseStationPos[0];
    const dy = uavPosition[1] - baseStationPos[1];
    const distance2d = Math.sqrt(dx * dx + dy * dy);
    const altitude = uavPosition[2];
    const distance3d = Math.sqrt(distance2d * distance2d + altitude * altitude);
    
    // Calculate path loss
    const pathLossDb = calculatePathLoss(distance3d, environment);
    
    // Calculate received signal strength
    const txPowerDbm = 20; // Transmission power
    const antennaGainDb = 3; // Antenna gain
    const noiseFloorDbm = -90; // Noise floor
    
    const receivedPowerDbm = txPowerDbm + antennaGainDb - pathLossDb;
    const snrDb = receivedPowerDbm - noiseFloorDbm;
    
    // Convert to signal strength percentage (0-100%)
    // Normalize SNR to percentage (assuming 0dB SNR = 50%, 30dB SNR = 100%)
    let signalStrength = Math.max(0, Math.min(100, 50 + (snrDb / 30) * 50));
    
    // Add random variations to simulate real-world conditions
    const signalVariation = 5 * (Math.random() - 0.5); // ±2.5% random variation
    signalStrength = Math.max(0, Math.min(100, signalStrength + signalVariation));
    
    // Determine ISAC mode based on signal strength
    let isacMode, dataRate;
    
    if (signalStrength >= 75) {
        isacMode = 'good';
        dataRate = calculateDataRate(signalStrength, 'high');
    } else if (signalStrength >= 40) {
        isacMode = 'medium';
        dataRate = calculateDataRate(signalStrength, 'medium');
    } else {
        isacMode = 'weak';
        dataRate = calculateDataRate(signalStrength, 'low');
    }
    
    // Apply hysteresis to prevent rapid mode switching
    const result = applyHysteresis(isacMode, signalStrength);
    
    return {
        isacMode: result.mode,
        signalStrength: signalStrength,
        dataRate: dataRate
    };
}

/**
 * Calculate data rate based on signal strength and quality level
 * @param {number} signalStrength - Signal strength percentage
 * @param {string} qualityLevel - 'high', 'medium', or 'low'
 * @returns {number} Data rate in Mbps
 */
function calculateDataRate(signalStrength, qualityLevel) {
    let baseRate, efficiency;
    
    switch (qualityLevel) {
        case 'high':
            baseRate = 50; // Mbps for high quality
            efficiency = 0.9;
            break;
        case 'medium':
            baseRate = 20; // Mbps for medium quality
            efficiency = 0.7;
            break;
        case 'low':
            baseRate = 5; // Mbps for low quality
            efficiency = 0.5;
            break;
        default:
            baseRate = 1;
            efficiency = 0.3;
    }
    
    // Scale data rate based on signal strength
    const signalFactor = signalStrength / 100;
    let dataRate = baseRate * signalFactor * efficiency;
    
    // Add some realistic constraints
    dataRate = Math.max(0.1, dataRate); // Minimum 0.1 Mbps
    
    return dataRate;
}

/**
 * Apply hysteresis to prevent rapid mode switching
 * @param {string} currentMode - Current ISAC mode
 * @param {number} signalStrength - Current signal strength
 * @returns {Object} {mode, switched}
 */
function applyHysteresis(currentMode, signalStrength) {
    // Static variables to maintain state between calls
    if (!applyHysteresis.previousMode) {
        applyHysteresis.previousMode = currentMode;
        applyHysteresis.modeSwitchTimer = 0;
    }
    
    let finalMode = currentMode;
    let switched = false;
    
    // Require mode to be stable for at least 10 seconds before switching
    if (currentMode !== applyHysteresis.previousMode) {
        applyHysteresis.modeSwitchTimer += 1;
        if (applyHysteresis.modeSwitchTimer < 5) { // 5 time steps = 10 seconds with dt=2
            finalMode = applyHysteresis.previousMode; // Keep previous mode
        } else {
            applyHysteresis.previousMode = currentMode;
            applyHysteresis.modeSwitchTimer = 0;
            switched = true;
            console.log(`ISAC mode switched to: ${currentMode.toUpperCase()} (Signal: ${signalStrength.toFixed(1)}%)`);
        }
    } else {
        applyHysteresis.modeSwitchTimer = 0;
    }
    
    return {
        mode: finalMode,
        switched: switched
    };
}

module.exports = {
    determineISACMode,
    calculateDataRate
};