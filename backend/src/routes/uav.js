/**
 * UAV Routes
 * Handles UAV data ingestion and processing
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Import services
const survivorService = require('../services/survivorService');
const isacService = require('../services/isacService');
const missionService = require('../services/missionService');

/**
 * POST /api/uav/data
 * Receive UAV sensor data and process it
 */
router.post('/data', async (req, res) => {
    try {
        const uavData = req.body;
        
        // Validate required fields
        if (!uavData.timestamp || !uavData.uavId || !uavData.location) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['timestamp', 'uavId', 'location']
            });
        }
        
        console.log(`📡 Received UAV data from ${uavData.uavId} - ISAC: ${uavData.isacMode?.toUpperCase()} (${uavData.signalStrength?.toFixed(1)}%)`);
        
        // Process ISAC status
        if (uavData.isacMode && uavData.signalStrength !== undefined) {
            await isacService.updateISACStatus({
                uavId: uavData.uavId,
                mode: uavData.isacMode,
                signalStrength: uavData.signalStrength,
                dataRate: uavData.dataRate,
                timestamp: uavData.timestamp
            });
        }
        
        // Process survivor detections
        if (uavData.detections && uavData.detections.length > 0) {
            console.log(`🔍 Processing ${uavData.detections.length} survivor detection(s)`);
            
            for (const detection of uavData.detections) {
                try {
                    const survivor = await survivorService.createSurvivor({
                        id: detection.id || uuidv4(),
                        coordinates: detection.coordinates,
                        confidence: detection.confidence,
                        detectionType: detection.type || 'human',
                        uavId: uavData.uavId,
                        timestamp: detection.timestamp || uavData.timestamp,
                        status: 'detected',
                        additionalInfo: detection.additionalInfo || null
                    });
                    
                    console.log(`✅ Survivor ${survivor.id} saved (confidence: ${(survivor.confidence * 100).toFixed(1)}%)`);
                    
                    // Emit real-time update via WebSocket
                    req.io.emit('survivor_detected', {
                        survivor: survivor,
                        uavData: {
                            uavId: uavData.uavId,
                            location: uavData.location,
                            isacMode: uavData.isacMode,
                            signalStrength: uavData.signalStrength
                        }
                    });
                    
                } catch (error) {
                    console.error(`Error processing detection ${detection.id}:`, error.message);
                }
            }
        }
        
        // Update mission data
        try {
            await missionService.updateMissionData({
                uavId: uavData.uavId,
                location: uavData.location,
                timestamp: uavData.timestamp,
                detectionsCount: uavData.detections ? uavData.detections.length : 0,
                isacMode: uavData.isacMode,
                signalStrength: uavData.signalStrength,
                batteryLevel: uavData.uavStatus?.batteryLevel
            });
        } catch (error) {
            console.error('Error updating mission data:', error.message);
        }
        
        // Emit ISAC status update via WebSocket
        if (uavData.isacMode) {
            req.io.emit('isac_mode_changed', {
                uavId: uavData.uavId,
                isacMode: uavData.isacMode,
                signalStrength: uavData.signalStrength,
                dataRate: uavData.dataRate,
                timestamp: uavData.timestamp,
                location: uavData.location
            });
        }
        
        // Emit general UAV update
        req.io.emit('uav_data_update', {
            uavId: uavData.uavId,
            location: uavData.location,
            isacMode: uavData.isacMode,
            signalStrength: uavData.signalStrength,
            batteryLevel: uavData.uavStatus?.batteryLevel,
            timestamp: uavData.timestamp,
            detectionsCount: uavData.detections ? uavData.detections.length : 0
        });
        
        // Send success response
        res.json({
            success: true,
            message: 'UAV data processed successfully',
            processed: {
                detections: uavData.detections ? uavData.detections.length : 0,
                isacMode: uavData.isacMode,
                signalStrength: uavData.signalStrength,
                timestamp: uavData.timestamp
            }
        });
        
    } catch (error) {
        console.error('Error processing UAV data:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * GET /api/uav/status
 * Get current UAV status
 */
router.get('/status', async (req, res) => {
    try {
        const uavId = req.query.uavId || 'UAV-001';
        
        // Get latest ISAC status
        const isacStatus = await isacService.getLatestISACStatus(uavId);
        
        // Get mission statistics
        const missionStats = await missionService.getMissionStatistics(uavId);
        
        // Get latest telemetry for UAV status
        const latestTelemetry = await missionService.getLatestTelemetry(uavId);
        
        // Build UAV status response
        const uavStatus = {
            uavId: uavId,
            location: latestTelemetry?.location || { lat: 22.5726, lng: 88.3639, altitude: 50 },
            batteryLevel: latestTelemetry?.batteryLevel || 100,
            isacMode: isacStatus?.mode || 'good',
            signalStrength: isacStatus?.signalStrength || 100,
            dataRate: isacStatus?.dataRate || 50,
            cameraActive: true,
            aiModelVersion: '1.0.0',
            lastUpdate: latestTelemetry?.timestamp || new Date().toISOString()
        };
        
        res.json({
            ...uavStatus,
            isacStatus: isacStatus,
            missionStats: missionStats,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error getting UAV status:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * GET /api/uav/telemetry
 * Get UAV telemetry data
 */
router.get('/telemetry', async (req, res) => {
    try {
        const uavId = req.query.uavId || 'UAV-001';
        const limit = parseInt(req.query.limit) || 50;
        
        // Get recent telemetry data
        const telemetryData = await missionService.getTelemetryHistory(uavId, limit);
        
        res.json({
            uavId: uavId,
            telemetry: telemetryData,
            count: telemetryData.length
        });
        
    } catch (error) {
        console.error('Error getting UAV telemetry:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

module.exports = router;