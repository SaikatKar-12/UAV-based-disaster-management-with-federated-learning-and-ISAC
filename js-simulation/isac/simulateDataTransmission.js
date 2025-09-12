/**
 * Data Transmission Simulation
 * Simulates data filtering and transmission based on ISAC mode
 */

/**
 * Simulate data transmission based on ISAC mode
 * @param {Object} sensorData - Raw sensor data from UAV
 * @param {string} isacMode - Current ISAC mode ('good', 'medium', 'weak')
 * @returns {Object} Filtered transmission data
 */
function simulateDataTransmission(sensorData, isacMode) {
    // Initialize transmission data structure
    const transmissionData = {
        timestamp: new Date().toISOString(),
        isacMode: isacMode,
        dataSizeBytes: 0,
        compressionApplied: isacMode !== 'good',
        estimatedTransmissionTime: 0
    };
    
    switch (isacMode.toLowerCase()) {
        case 'good':
            // Full data transmission - all available data
            processGoodModeData(sensorData, transmissionData);
            break;
            
        case 'medium':
            // Compressed transmission - reduced quality video + detections
            processMediumModeData(sensorData, transmissionData);
            break;
            
        case 'weak':
            // Critical data only - survivor coordinates and confidence
            processWeakModeData(sensorData, transmissionData);
            break;
            
        default:
            console.warn(`Unknown ISAC mode: ${isacMode}. Using weak mode.`);
            processWeakModeData(sensorData, transmissionData);
    }
    
    // Add transmission metadata
    transmissionData.estimatedTransmissionTime = estimateTransmissionTime(
        transmissionData.dataSizeBytes, 
        isacMode
    );
    
    console.log(`Data prepared for transmission: ${isacMode.toUpperCase()} mode, ${(transmissionData.dataSizeBytes / 1024).toFixed(1)} KB`);
    
    return transmissionData;
}

/**
 * Process data for good network mode
 * @param {Object} sensorData - Raw sensor data
 * @param {Object} transmissionData - Transmission data object to populate
 */
function processGoodModeData(sensorData, transmissionData) {
    // High-quality video stream
    if (sensorData.videoFrame) {
        transmissionData.videoStream = sensorData.videoFrame;
        transmissionData.videoQuality = '1080p';
        transmissionData.videoCompression = 'none';
        transmissionData.dataSizeBytes += 500000; // ~500KB per frame
    }
    
    // All survivor detections with full metadata
    if (sensorData.detections) {
        transmissionData.detections = sensorData.detections;
        transmissionData.detectionMetadata = sensorData.detectionMetadata;
        transmissionData.dataSizeBytes += sensorData.detections.length * 200; // ~200B per detection
    }
    
    // AI model updates (federated learning weights)
    if (sensorData.modelUpdates) {
        transmissionData.modelUpdates = sensorData.modelUpdates;
        transmissionData.dataSizeBytes += 50000; // ~50KB for model weights
    }
    
    // Environmental sensor data
    if (sensorData.environmentalData) {
        transmissionData.environmentalData = sensorData.environmentalData;
        transmissionData.dataSizeBytes += 1000; // ~1KB for env data
    }
    
    // UAV telemetry data
    if (sensorData.telemetry) {
        transmissionData.telemetry = sensorData.telemetry;
        transmissionData.dataSizeBytes += 500; // ~500B for telemetry
    }
}

/**
 * Process data for medium network mode
 * @param {Object} sensorData - Raw sensor data
 * @param {Object} transmissionData - Transmission data object to populate
 */
function processMediumModeData(sensorData, transmissionData) {
    // Compressed video stream
    if (sensorData.videoFrame) {
        transmissionData.videoStream = compressVideoFrame(sensorData.videoFrame, 0.3);
        transmissionData.videoQuality = '480p';
        transmissionData.videoCompression = 'high';
        transmissionData.dataSizeBytes += 150000; // ~150KB compressed
    }
    
    // Survivor detections (essential data only)
    if (sensorData.detections) {
        transmissionData.detections = filterEssentialDetections(sensorData.detections);
        transmissionData.dataSizeBytes += transmissionData.detections.length * 100; // ~100B per detection
    }
    
    // Critical telemetry only
    if (sensorData.telemetry) {
        transmissionData.telemetry = filterCriticalTelemetry(sensorData.telemetry);
        transmissionData.dataSizeBytes += 200; // ~200B for critical telemetry
    }
    
    // No model updates in medium mode to save bandwidth
    transmissionData.modelUpdates = null;
}

/**
 * Process data for weak network mode
 * @param {Object} sensorData - Raw sensor data
 * @param {Object} transmissionData - Transmission data object to populate
 */
function processWeakModeData(sensorData, transmissionData) {
    // No video transmission
    transmissionData.videoStream = null;
    transmissionData.videoQuality = 'none';
    
    // Only high-confidence survivor detections
    if (sensorData.detections) {
        transmissionData.detections = filterHighConfidenceDetections(sensorData.detections);
        transmissionData.dataSizeBytes += transmissionData.detections.length * 50; // ~50B per detection (coordinates only)
    }
    
    // Minimal telemetry (position and battery only)
    if (sensorData.telemetry) {
        transmissionData.telemetry = {
            position: sensorData.telemetry.position,
            batteryLevel: sensorData.telemetry.batteryLevel,
            timestamp: new Date().toISOString()
        };
        transmissionData.dataSizeBytes += 100; // ~100B for minimal telemetry
    }
    
    // No model updates or environmental data
    transmissionData.modelUpdates = null;
    transmissionData.environmentalData = null;
}

/**
 * Simulate video compression
 * @param {Object} videoFrame - Original video frame
 * @param {number} compressionRatio - Compression ratio (0-1)
 * @returns {Object} Compressed video frame
 */
function compressVideoFrame(videoFrame, compressionRatio) {
    if (!videoFrame) return null;
    
    const originalSize = videoFrame.data ? videoFrame.data.length : 500000;
    const compressedSize = Math.round(originalSize * compressionRatio);
    
    return {
        data: videoFrame.data ? videoFrame.data.slice(0, compressedSize) : 'compressed_video_data',
        compressionRatio: compressionRatio,
        originalSize: originalSize,
        compressedSize: compressedSize,
        quality: '480p',
        format: videoFrame.format || 'H264'
    };
}

/**
 * Filter detections to include only essential information
 * @param {Array} detections - Array of detection objects
 * @returns {Array} Filtered detections
 */
function filterEssentialDetections(detections) {
    if (!detections || !Array.isArray(detections)) return [];
    
    return detections
        .filter(detection => detection.confidence > 0.6) // Only confidence > 60%
        .map(detection => ({
            id: detection.id,
            coordinates: detection.coordinates,
            confidence: detection.confidence,
            type: detection.type,
            timestamp: detection.timestamp
        }));
}

/**
 * Filter to only high-confidence detections for weak network mode
 * @param {Array} detections - Array of detection objects
 * @returns {Array} High-confidence detections
 */
function filterHighConfidenceDetections(detections) {
    if (!detections || !Array.isArray(detections)) return [];
    
    return detections
        .filter(detection => detection.confidence > 0.8) // Only high-confidence detections (> 80%)
        .map(detection => ({
            id: detection.id,
            coordinates: detection.coordinates,
            confidence: detection.confidence
        }));
}

/**
 * Extract only critical telemetry data
 * @param {Object} telemetry - Full telemetry object
 * @returns {Object} Critical telemetry data
 */
function filterCriticalTelemetry(telemetry) {
    if (!telemetry) return {};
    
    const criticalTelemetry = {};
    
    if (telemetry.position) {
        criticalTelemetry.position = telemetry.position;
    }
    
    if (telemetry.batteryLevel !== undefined) {
        criticalTelemetry.batteryLevel = telemetry.batteryLevel;
    }
    
    if (telemetry.altitude !== undefined) {
        criticalTelemetry.altitude = telemetry.altitude;
    }
    
    // Add timestamp
    criticalTelemetry.timestamp = new Date().toISOString();
    
    return criticalTelemetry;
}

/**
 * Estimate transmission time based on data size and ISAC mode
 * @param {number} dataSizeBytes - Data size in bytes
 * @param {string} isacMode - Current ISAC mode
 * @returns {number} Estimated transmission time in seconds
 */
function estimateTransmissionTime(dataSizeBytes, isacMode) {
    // Typical data rates for different modes (bytes per second)
    let dataRateBps;
    
    switch (isacMode.toLowerCase()) {
        case 'good':
            dataRateBps = 6250000; // 50 Mbps = 6.25 MB/s
            break;
        case 'medium':
            dataRateBps = 2500000; // 20 Mbps = 2.5 MB/s
            break;
        case 'weak':
            dataRateBps = 625000;  // 5 Mbps = 0.625 MB/s
            break;
        default:
            dataRateBps = 125000;  // 1 Mbps = 0.125 MB/s
    }
    
    // Calculate transmission time in seconds
    let transmissionTime = dataSizeBytes / dataRateBps;
    
    // Add some overhead (protocol overhead, retransmissions, etc.)
    const overheadFactor = 1.2; // 20% overhead
    transmissionTime *= overheadFactor;
    
    return transmissionTime;
}

module.exports = {
    simulateDataTransmission,
    processGoodModeData,
    processMediumModeData,
    processWeakModeData,
    compressVideoFrame,
    filterEssentialDetections,
    filterHighConfidenceDetections,
    filterCriticalTelemetry,
    estimateTransmissionTime
};