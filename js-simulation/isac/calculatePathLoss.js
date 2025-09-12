/**
 * Path Loss Calculation
 * Calculates RF path loss considering various environmental factors
 */

/**
 * Calculate path loss based on distance and environmental conditions
 * @param {number} distanceM - Distance in meters
 * @param {Object} environment - Environmental conditions
 * @returns {number} Path loss in dB
 */
function calculatePathLoss(distanceM, environment) {
    // Frequency in Hz (2.4 GHz for WiFi)
    const frequencyHz = 2.4e9;
    
    // Free Space Path Loss (FSPL)
    // FSPL(dB) = 20*log10(d) + 20*log10(f) + 20*log10(4π/c)
    // Simplified: FSPL(dB) = 20*log10(d) + 20*log10(f) + 92.45
    const fsplDb = 20 * Math.log10(distanceM) + 20 * Math.log10(frequencyHz / 1e9) + 92.45;
    
    // Environmental losses
    const environmentalLoss = calculateEnvironmentalLoss(environment);
    
    // Terrain-specific losses
    const terrainLoss = calculateTerrainLoss(distanceM, environment);
    
    // Weather effects
    const weatherLoss = calculateWeatherLoss(environment);
    
    // Total path loss
    let pathLossDb = fsplDb + environmentalLoss + terrainLoss + weatherLoss;
    
    // Add some random fading (Rayleigh/Rician fading simulation)
    const fadingLoss = simulateFading();
    pathLossDb += fadingLoss;
    
    // Ensure path loss is reasonable (minimum 40 dB, maximum 150 dB)
    pathLossDb = Math.max(40, Math.min(150, pathLossDb));
    
    return pathLossDb;
}

/**
 * Calculate environmental loss factors
 * @param {Object} environment - Environmental conditions
 * @returns {number} Environmental loss in dB
 */
function calculateEnvironmentalLoss(environment) {
    let envLoss = 0;
    
    // Building obstruction losses
    if (environment.buildings && environment.buildings.length > 0) {
        const numBuildings = environment.buildings.length;
        envLoss += numBuildings * 8; // 8 dB per building
    } else {
        // Random building obstruction based on terrain type
        const terrainType = environment.terrainType || 'urban';
        let buildingProb;
        
        switch (terrainType) {
            case 'urban':
                buildingProb = 0.4;
                break;
            case 'suburban':
                buildingProb = 0.2;
                break;
            case 'rural':
                buildingProb = 0.05;
                break;
            default:
                buildingProb = 0.1;
        }
        
        if (Math.random() < buildingProb) {
            const numBuildings = Math.floor(Math.random() * 3) + 1; // 1-3 buildings
            envLoss += numBuildings * 6; // 6 dB each
        }
    }
    
    // Tree/vegetation losses
    if (environment.trees && environment.trees.length > 0) {
        const numTrees = environment.trees.length;
        envLoss += numTrees * 2; // 2 dB per tree cluster
    } else {
        // Random vegetation
        if (Math.random() < 0.3) { // 30% chance of vegetation
            const numTreeClusters = Math.floor(Math.random() * 5) + 1; // 1-5 tree clusters
            envLoss += numTreeClusters * 1.5; // 1.5 dB each
        }
    }
    
    return envLoss;
}

/**
 * Calculate terrain-specific losses
 * @param {number} distanceM - Distance in meters
 * @param {Object} environment - Environmental conditions
 * @returns {number} Terrain loss in dB
 */
function calculateTerrainLoss(distanceM, environment) {
    let terrainLoss = 0;
    
    // Distance-dependent terrain loss
    if (distanceM > 1000) { // Beyond 1 km
        terrainLoss += 5; // Additional 5 dB for long distances
    }
    
    // Terrain type specific losses
    const terrainType = environment.terrainType || 'urban';
    
    switch (terrainType) {
        case 'mountainous':
            terrainLoss += 10; // Mountainous terrain
            break;
        case 'urban':
            terrainLoss += 5; // Urban canyon effects
            break;
        case 'rural':
            terrainLoss += 2; // Minimal terrain effects
            break;
        default:
            terrainLoss += 3; // Default terrain loss
    }
    
    return terrainLoss;
}

/**
 * Calculate weather-related losses
 * @param {Object} environment - Environmental conditions
 * @returns {number} Weather loss in dB
 */
function calculateWeatherLoss(environment) {
    let weatherLoss = 0;
    
    if (environment.weather) {
        const weather = environment.weather;
        
        // Rain attenuation (frequency dependent)
        if (weather.rain) {
            const rainRate = weather.precipitationIntensity || 10; // mm/hr (moderate rain)
            // Rain attenuation at 2.4 GHz is approximately 0.01 dB/km per mm/hr
            weatherLoss += 0.01 * rainRate * 0.5; // Assume 500m path through rain
        }
        
        // Fog attenuation
        if (weather.fog) {
            weatherLoss += 2; // 2 dB for fog
        }
        
        // Wind effects (minimal at 2.4 GHz but can cause antenna movement)
        if (weather.windSpeed && weather.windSpeed > 10) {
            weatherLoss += 1; // 1 dB for high wind
        }
    }
    
    return weatherLoss;
}

/**
 * Simulate multipath fading effects
 * @returns {number} Fading loss in dB
 */
function simulateFading() {
    // Simulate multipath fading effects
    // Rayleigh fading for NLOS, Rician for LOS
    
    let fadingDb;
    
    // Assume 70% probability of LOS (Line of Sight)
    if (Math.random() < 0.7) {
        // Rician fading (LOS)
        const kFactorDb = 10; // K-factor in dB (strong LOS component)
        const kLinear = Math.pow(10, kFactorDb / 10);
        
        // Generate Rician distributed random variable
        const sigma = 1;
        const s = Math.sqrt(kLinear / (kLinear + 1)) * sigma;
        const sigmaN = Math.sqrt(1 / (2 * (kLinear + 1))) * sigma;
        
        // Box-Muller transform for Gaussian random numbers
        const u1 = Math.random();
        const u2 = Math.random();
        const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        const z2 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
        
        const realPart = s + sigmaN * z1;
        const imagPart = sigmaN * z2;
        
        const amplitude = Math.sqrt(realPart * realPart + imagPart * imagPart);
        fadingDb = -20 * Math.log10(amplitude / sigma); // Convert to dB loss
    } else {
        // Rayleigh fading (NLOS)
        // Generate Rayleigh distributed random variable
        const sigma = 1;
        const u = Math.random();
        const amplitude = sigma * Math.sqrt(-2 * Math.log(u));
        fadingDb = -20 * Math.log10(amplitude / sigma); // Convert to dB loss
    }
    
    // Limit fading to reasonable range
    fadingDb = Math.max(-10, Math.min(20, fadingDb)); // -10 to +20 dB
    
    return fadingDb;
}

module.exports = {
    calculatePathLoss,
    calculateEnvironmentalLoss,
    calculateTerrainLoss,
    calculateWeatherLoss,
    simulateFading
};