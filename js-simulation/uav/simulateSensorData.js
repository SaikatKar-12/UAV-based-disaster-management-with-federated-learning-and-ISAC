/**
 * UAV Sensor Data Simulation
 * Simulates camera, AI detection, and other sensor data from UAV
 */

/**
 * Simulate sensor data collection from UAV
 * @param {Object} uav - UAV object with position, id, etc.
 * @param {Object} environment - Environmental conditions
 * @param {number} currentTime - Current simulation time in seconds
 * @returns {Object} Simulated sensor data
 */
function simulateSensorData(uav, environment, currentTime) {
    const sensorData = {
        timestamp: new Date().toISOString(),
        uavId: uav.id,
        position: uav.position
    };
    
    // Simulate camera data
    sensorData.videoFrame = simulateVideoFrame(uav, environment);
    
    // Simulate AI-based survivor detection
    sensorData.detections = simulateSurvivorDetection(uav, environment, currentTime);
    sensorData.detectionMetadata = generateDetectionMetadata(sensorData.detections);
    
    // Simulate UAV telemetry
    sensorData.telemetry = simulateTelemetry(uav);
    
    // Simulate environmental sensor data
    sensorData.environmentalData = simulateEnvironmentalSensors(uav, environment);
    
    // Simulate federated learning model updates
    sensorData.modelUpdates = simulateModelUpdates(uav, currentTime);
    
    // Add data quality metrics
    sensorData.dataQuality = assessDataQuality(sensorData, environment);
    
    return sensorData;
}

/**
 * Simulate video frame capture from UAV camera
 * @param {Object} uav - UAV object
 * @param {Object} environment - Environmental conditions
 * @returns {Object} Simulated video frame
 */
function simulateVideoFrame(uav, environment) {
    const videoFrame = {
        resolution: '1920x1080',
        format: 'RGB',
        quality: calculateVideoQuality(uav, environment)
    };
    
    // Simulate frame data (in real implementation, this would be actual image data)
    const frameSize = 1920 * 1080 * 3; // RGB pixels
    videoFrame.data = new Array(frameSize).fill(0).map(() => Math.floor(Math.random() * 256));
    
    // Camera parameters
    videoFrame.cameraParams = {
        focalLength: 24, // mm
        aperture: 2.8,
        iso: calculateOptimalISO(environment),
        shutterSpeed: calculateShutterSpeed(uav)
    };
    
    // Field of view coverage
    videoFrame.coverage = calculateCoverageArea(uav);
    videoFrame.timestamp = new Date().toISOString();
    
    return videoFrame;
}

/**
 * Simulate AI-based survivor detection
 * @param {Object} uav - UAV object
 * @param {Object} environment - Environmental conditions
 * @param {number} currentTime - Current simulation time
 * @returns {Array} Array of detection objects
 */
function simulateSurvivorDetection(uav, environment, currentTime) {
    const detections = [];
    
    // Detection probability based on various factors
    const baseDetectionProb = 0.15; // 15% chance per time step
    const detectionProb = calculateDetectionProbability(uav, environment, baseDetectionProb);
    
    // Determine if any survivors are detected
    if (Math.random() < detectionProb) {
        const numDetections = Math.floor(Math.random() * 3) + 1; // 1-3 survivors detected
        
        for (let i = 0; i < numDetections; i++) {
            const detection = generateSurvivorDetection(uav, environment, currentTime);
            detections.push(detection);
        }
    }
    
    // Add false positives occasionally
    const falsePositiveProb = 0.05; // 5% chance of false positive
    if (Math.random() < falsePositiveProb) {
        const falseDetection = generateFalsePositiveDetection(uav, currentTime);
        detections.push(falseDetection);
    }
    
    return detections;
}

/**
 * Generate a single survivor detection
 * @param {Object} uav - UAV object
 * @param {Object} environment - Environmental conditions
 * @param {number} currentTime - Current simulation time
 * @returns {Object} Detection object
 */
function generateSurvivorDetection(uav, environment, currentTime) {
    const detection = {};
    
    // Generate unique detection ID
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    detection.id = `SUR-${timestamp}-${Math.floor(Math.random() * 9000) + 1000}`;
    
    // Generate survivor location (within UAV's field of view)
    const coverageArea = calculateCoverageArea(uav);
    const localCoords = generateRandomLocationInArea(coverageArea);
    
    // Convert to GPS coordinates
    detection.coordinates = {
        lat: convertToLatLng(localCoords.x, 'lat'),
        lng: convertToLatLng(localCoords.y, 'lng')
    };
    
    // Detection confidence based on various factors
    detection.confidence = calculateDetectionConfidence(uav, environment);
    
    // Detection type and characteristics
    detection.type = 'human';
    detection.status = 'detected'; // detected, rescued, false_positive
    
    // Additional detection information
    detection.estimatedAge = Math.floor(Math.random() * 51) + 20; // 20-70 years
    detection.movementDetected = Math.random() > 0.3; // 70% chance of movement
    detection.heatSignature = Math.random() > 0.2; // 80% chance of heat signature
    
    // Detection metadata
    detection.detectionMethod = 'ai_vision';
    detection.modelVersion = uav.aiModelVersion || '1.0';
    detection.timestamp = new Date().toISOString();
    
    // Environmental context
    detection.environmentalContext = {
        terrain: environment.terrainType || 'urban',
        visibility: calculateVisibility(environment),
        weatherConditions: environment.weather || {}
    };
    
    return detection;
}

/**
 * Generate a false positive detection
 * @param {Object} uav - UAV object
 * @param {number} currentTime - Current simulation time
 * @returns {Object} False positive detection object
 */
function generateFalsePositiveDetection(uav, currentTime) {
    const detection = generateSurvivorDetection(uav, { terrainType: 'urban' }, currentTime);
    
    // Modify characteristics for false positive
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    detection.id = `FP-${timestamp}-${Math.floor(Math.random() * 9000) + 1000}`;
    detection.confidence = 0.3 + Math.random() * 0.3; // Lower confidence (30-60%)
    detection.type = 'false_positive';
    detection.movementDetected = false;
    detection.heatSignature = Math.random() > 0.8; // Lower chance of heat signature
    
    // Common false positive sources
    const falsePositiveSources = ['debris', 'animal', 'shadow', 'vegetation', 'equipment'];
    detection.likelySource = falsePositiveSources[Math.floor(Math.random() * falsePositiveSources.length)];
    
    return detection;
}

/**
 * Simulate UAV telemetry data
 * @param {Object} uav - UAV object
 * @returns {Object} Telemetry data
 */
function simulateTelemetry(uav) {
    const telemetry = {};
    
    // Position and orientation
    telemetry.position = [...uav.position];
    telemetry.velocity = [...uav.velocity];
    telemetry.heading = Math.atan2(uav.velocity[1], uav.velocity[0]) * 180 / Math.PI; // degrees
    
    // Attitude (roll, pitch, yaw)
    telemetry.attitude = {
        roll: (Math.random() - 0.5) * 10, // ±5 degrees
        pitch: (Math.random() - 0.5) * 10, // ±5 degrees
        yaw: telemetry.heading
    };
    
    // System status
    telemetry.batteryLevel = uav.batteryLevel;
    telemetry.batteryVoltage = 22.2 + (uav.batteryLevel / 100) * 3.0; // 22.2-25.2V
    telemetry.motorTemperatures = Array(4).fill(0).map(() => 40 + Math.random() * 20); // 40-60°C for 4 motors
    telemetry.cpuTemperature = 50 + Math.random() * 30; // 50-80°C
    telemetry.cpuUsage = 60 + Math.random() * 30; // 60-90% CPU usage
    telemetry.memoryUsage = 70 + Math.random() * 20; // 70-90% memory usage
    
    // Communication status
    telemetry.signalStrength = 50 + Math.random() * 50; // 50-100%
    telemetry.dataLinkQuality = 80 + Math.random() * 20; // 80-100%
    
    // Flight parameters
    telemetry.flightTime = 300; // seconds (example)
    telemetry.distanceTraveled = Math.sqrt(uav.position[0] * uav.position[0] + uav.position[1] * uav.position[1]);
    telemetry.altitudeAgl = uav.position[2]; // Above ground level
    
    // Sensor status
    telemetry.cameraStatus = uav.cameraActive !== false;
    telemetry.gpsStatus = 'fixed'; // fixed, float, no_fix
    telemetry.gpsSatellites = Math.floor(Math.random() * 8) + 8; // 8-15 satellites
    telemetry.gpsHdop = 0.8 + Math.random() * 0.4; // Horizontal dilution of precision
    
    telemetry.timestamp = new Date().toISOString();
    
    return telemetry;
}

/**
 * Simulate environmental sensor readings
 * @param {Object} uav - UAV object
 * @param {Object} environment - Environmental conditions
 * @returns {Object} Environmental sensor data
 */
function simulateEnvironmentalSensors(uav, environment) {
    const envData = {};
    
    // Weather sensors
    envData.temperature = 25 + Math.random() * 10; // 25-35°C
    envData.humidity = 40 + Math.random() * 40; // 40-80%
    envData.pressure = 1013 + (Math.random() - 0.5) * 20; // 1003-1023 hPa
    envData.windSpeed = 2 + Math.random() * 8; // 2-10 m/s
    envData.windDirection = Math.random() * 360; // 0-360 degrees
    
    // Air quality sensors
    envData.airQuality = {
        pm25: 10 + Math.random() * 40, // PM2.5 μg/m³
        pm10: 15 + Math.random() * 50, // PM10 μg/m³
        co2: 400 + Math.random() * 100 // CO2 ppm
    };
    
    // Light and visibility
    envData.lightLevel = 500 + Math.random() * 1000; // Lux
    envData.visibility = 5 + Math.random() * 15; // km
    
    // Radiation (for disaster scenarios)
    envData.radiationLevel = 0.1 + Math.random() * 0.2; // μSv/h (normal background)
    
    // Noise level
    envData.noiseLevel = 40 + Math.random() * 30; // 40-70 dB
    
    envData.timestamp = new Date().toISOString();
    
    return envData;
}

/**
 * Simulate federated learning model updates
 * @param {Object} uav - UAV object
 * @param {number} currentTime - Current simulation time
 * @returns {Object} Model update data
 */
function simulateModelUpdates(uav, currentTime) {
    const modelUpdates = {};
    
    // Only generate model updates occasionally (every 30 seconds)
    if (currentTime % 30 < 2) { // Within 2 seconds of 30-second intervals
        modelUpdates.available = true;
        modelUpdates.modelVersion = uav.aiModelVersion || '1.0';
        modelUpdates.updateType = 'incremental';
        
        // Simulated performance metrics
        modelUpdates.accuracyImprovement = Math.random() * 0.05; // 0-5% improvement
        modelUpdates.trainingSamples = Math.floor(Math.random() * 151) + 50; // 50-200 samples
        modelUpdates.convergenceScore = 0.8 + Math.random() * 0.2; // 0.8-1.0
        
        // Simulated model weights (in real implementation, these would be actual neural network weights)
        modelUpdates.weightUpdates = {
            layer1: Array(64).fill(0).map(() => Array(32).fill(0).map(() => Math.random())),
            layer2: Array(32).fill(0).map(() => Array(16).fill(0).map(() => Math.random())),
            outputLayer: Array(16).fill(0).map(() => Math.random())
        };
        
        modelUpdates.timestamp = new Date().toISOString();
    } else {
        modelUpdates.available = false;
    }
    
    return modelUpdates;
}

// Helper functions

/**
 * Calculate video quality based on conditions
 * @param {Object} uav - UAV object
 * @param {Object} environment - Environmental conditions
 * @returns {number} Video quality (0-1)
 */
function calculateVideoQuality(uav, environment) {
    let baseQuality = 0.9; // 90% base quality
    
    // Reduce quality based on altitude (atmospheric effects)
    const altitudeFactor = Math.max(0.7, 1 - uav.position[2] / 1000);
    
    // Reduce quality based on speed (motion blur)
    const speed = Math.sqrt(uav.velocity[0] * uav.velocity[0] + uav.velocity[1] * uav.velocity[1]);
    const speedFactor = Math.max(0.8, 1 - speed / 20);
    
    // Weather effects
    let weatherFactor = 1.0;
    if (environment.weather) {
        if (environment.weather.rain) {
            weatherFactor *= 0.7;
        }
        if (environment.weather.fog) {
            weatherFactor *= 0.6;
        }
    }
    
    return baseQuality * altitudeFactor * speedFactor * weatherFactor;
}

/**
 * Calculate optimal ISO setting based on lighting conditions
 * @param {Object} environment - Environmental conditions
 * @returns {number} ISO value
 */
function calculateOptimalISO(environment) {
    let baseIso = 100;
    
    // Increase ISO in low light conditions
    if (environment.lightLevel) {
        if (environment.lightLevel < 200) {
            baseIso = 400; // ISO 400
        } else if (environment.lightLevel < 500) {
            baseIso = 200; // ISO 200
        }
    }
    
    return baseIso;
}

/**
 * Calculate optimal shutter speed based on UAV movement
 * @param {Object} uav - UAV object
 * @returns {number} Shutter speed (fraction of second)
 */
function calculateShutterSpeed(uav) {
    const speed = Math.sqrt(uav.velocity[0] * uav.velocity[0] + uav.velocity[1] * uav.velocity[1]);
    
    // Faster shutter speed for higher speeds to reduce motion blur
    if (speed > 10) {
        return 1/1000; // 1/1000s
    } else if (speed > 5) {
        return 1/500; // 1/500s
    } else {
        return 1/250; // 1/250s
    }
}

/**
 * Calculate the ground area covered by UAV camera
 * @param {Object} uav - UAV object
 * @returns {Object} Coverage area
 */
function calculateCoverageArea(uav) {
    const altitude = uav.position[2];
    const fovHorizontal = 60; // degrees
    const fovVertical = 45; // degrees
    
    // Calculate coverage dimensions
    const coverageWidth = 2 * altitude * Math.tan((fovHorizontal / 2) * Math.PI / 180);
    const coverageHeight = 2 * altitude * Math.tan((fovVertical / 2) * Math.PI / 180);
    
    return {
        centerX: uav.position[0],
        centerY: uav.position[1],
        width: coverageWidth,
        height: coverageHeight
    };
}

/**
 * Generate random location within coverage area
 * @param {Object} coverageArea - Coverage area object
 * @returns {Object} Random location {x, y}
 */
function generateRandomLocationInArea(coverageArea) {
    return {
        x: coverageArea.centerX + (Math.random() - 0.5) * coverageArea.width,
        y: coverageArea.centerY + (Math.random() - 0.5) * coverageArea.height
    };
}

/**
 * Calculate detection confidence based on various factors
 * @param {Object} uav - UAV object
 * @param {Object} environment - Environmental conditions
 * @returns {number} Detection confidence (0-1)
 */
function calculateDetectionConfidence(uav, environment) {
    let baseConfidence = 0.8; // 80% base confidence
    
    // Altitude factor (optimal altitude around 50m)
    const optimalAltitude = 50;
    let altitudeFactor = 1 - Math.abs(uav.position[2] - optimalAltitude) / 100;
    altitudeFactor = Math.max(0.5, Math.min(1.0, altitudeFactor));
    
    // Speed factor (lower speed = better detection)
    const speed = Math.sqrt(uav.velocity[0] * uav.velocity[0] + uav.velocity[1] * uav.velocity[1]);
    const speedFactor = Math.max(0.6, 1 - speed / 15);
    
    // Environmental factors
    let envFactor = 1.0;
    if (environment.weather) {
        if (environment.weather.rain) {
            envFactor *= 0.8;
        }
        if (environment.weather.fog) {
            envFactor *= 0.7;
        }
    }
    
    let confidence = baseConfidence * altitudeFactor * speedFactor * envFactor;
    
    // Add some random variation
    confidence += (Math.random() - 0.5) * 0.1;
    confidence = Math.max(0.3, Math.min(0.95, confidence)); // Clamp between 30% and 95%
    
    return confidence;
}

/**
 * Calculate probability of detecting survivors
 * @param {Object} uav - UAV object
 * @param {Object} environment - Environmental conditions
 * @param {number} baseProb - Base detection probability
 * @returns {number} Detection probability
 */
function calculateDetectionProbability(uav, environment, baseProb) {
    let detectionProb = baseProb;
    
    // Increase probability at optimal altitude
    if (uav.position[2] > 30 && uav.position[2] < 80) {
        detectionProb *= 1.5;
    }
    
    // Decrease probability for high speed
    const speed = Math.sqrt(uav.velocity[0] * uav.velocity[0] + uav.velocity[1] * uav.velocity[1]);
    if (speed > 10) {
        detectionProb *= 0.7;
    }
    
    // Environmental effects
    const terrainType = environment.terrainType || 'urban';
    switch (terrainType) {
        case 'urban':
            detectionProb *= 1.2; // Higher survivor density
            break;
        case 'rural':
            detectionProb *= 0.8;
            break;
        case 'mountainous':
            detectionProb *= 0.6;
            break;
    }
    
    return detectionProb;
}

/**
 * Generate metadata for all detections
 * @param {Array} detections - Array of detection objects
 * @returns {Object} Detection metadata
 */
function generateDetectionMetadata(detections) {
    const metadata = {
        totalDetections: detections.length,
        highConfidenceCount: detections.filter(d => d.confidence > 0.8).length,
        mediumConfidenceCount: detections.filter(d => d.confidence > 0.6 && d.confidence <= 0.8).length,
        lowConfidenceCount: detections.filter(d => d.confidence <= 0.6).length,
        averageConfidence: detections.length > 0 ? detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length : 0,
        detectionDensity: detections.length / 1000 // detections per km²
    };
    
    return metadata;
}

/**
 * Assess overall data quality
 * @param {Object} sensorData - Sensor data object
 * @param {Object} environment - Environmental conditions
 * @returns {Object} Data quality assessment
 */
function assessDataQuality(sensorData, environment) {
    const quality = {
        videoQuality: sensorData.videoFrame ? sensorData.videoFrame.quality : 0,
        detectionReliability: sensorData.detections.length > 0 ? 
            sensorData.detections.reduce((sum, d) => sum + d.confidence, 0) / sensorData.detections.length : 0,
        telemetryAccuracy: 0.95, // Assume high telemetry accuracy
        environmentalSensorAccuracy: 0.90
    };
    
    quality.overallScore = (quality.videoQuality + quality.detectionReliability + 
                           quality.telemetryAccuracy + quality.environmentalSensorAccuracy) / 4;
    
    return quality;
}

/**
 * Calculate visibility based on environmental conditions
 * @param {Object} environment - Environmental conditions
 * @returns {number} Visibility in km
 */
function calculateVisibility(environment) {
    let visibility = 10; // km base visibility
    
    if (environment.weather) {
        if (environment.weather.rain) {
            visibility *= 0.5;
        }
        if (environment.weather.fog) {
            visibility *= 0.2;
        }
    }
    
    return Math.max(0.1, visibility); // Minimum 100m visibility
}

/**
 * Convert local coordinates to GPS coordinates
 * @param {number} positionM - Position in meters
 * @param {string} coordType - 'lat' or 'lng'
 * @returns {number} GPS coordinate
 */
function convertToLatLng(positionM, coordType) {
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

module.exports = {
    simulateSensorData,
    simulateVideoFrame,
    simulateSurvivorDetection,
    generateSurvivorDetection,
    generateFalsePositiveDetection,
    simulateTelemetry,
    simulateEnvironmentalSensors,
    simulateModelUpdates,
    calculateVideoQuality,
    calculateDetectionConfidence,
    calculateDetectionProbability,
    generateDetectionMetadata,
    assessDataQuality,
    convertToLatLng
};