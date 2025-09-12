/**
 * ISAC Routes
 * Handles ISAC status and communication endpoints
 */

const express = require('express');
const router = express.Router();
const isacService = require('../services/isacService');

/**
 * GET /api/isac/status
 * Get current ISAC status
 */
router.get('/status', async (req, res) => {
    try {
        const uavId = req.query.uavId || 'UAV-001';
        
        const isacStatus = await isacService.getLatestISACStatus(uavId);
        
        if (!isacStatus) {
            return res.json({
                uavId: uavId,
                mode: 'unknown',
                signalStrength: 0,
                dataRate: 0,
                availableStreams: {
                    video: false,
                    detections: false,
                    modelUpdates: false
                },
                message: 'No ISAC data available'
            });
        }
        
        res.json(isacStatus);
    } catch (error) {
        console.error('Error getting ISAC status:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * GET /api/isac/history
 * Get ISAC status history
 */
router.get('/history', async (req, res) => {
    try {
        const uavId = req.query.uavId || 'UAV-001';
        const limit = parseInt(req.query.limit) || 50;
        
        const history = await isacService.getISACStatusHistory(uavId, limit);
        
        res.json({
            uavId: uavId,
            history: history,
            count: history.length
        });
    } catch (error) {
        console.error('Error getting ISAC history:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * GET /api/isac/stats
 * Get ISAC statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const uavId = req.query.uavId;
        
        const stats = await isacService.getISACStatistics(uavId);
        
        res.json(stats);
    } catch (error) {
        console.error('Error getting ISAC statistics:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

module.exports = router;