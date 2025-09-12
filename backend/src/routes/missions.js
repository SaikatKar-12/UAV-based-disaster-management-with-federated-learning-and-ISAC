/**
 * Mission Routes
 * Handles mission management endpoints
 */

const express = require('express');
const router = express.Router();
const missionService = require('../services/missionService');

/**
 * GET /api/missions
 * Get all missions
 */
router.get('/', async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            uavId: req.query.uavId,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined
        };

        const missions = await missionService.getAllMissions(filters);
        
        res.json(missions);
    } catch (error) {
        console.error('Error getting missions:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * GET /api/missions/:id
 * Get mission by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const mission = await missionService.getMissionById(req.params.id);
        
        if (!mission) {
            return res.status(404).json({
                error: 'Mission not found'
            });
        }
        
        res.json(mission);
    } catch (error) {
        console.error('Error getting mission:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * GET /api/missions/stats
 * Get mission statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const uavId = req.query.uavId || 'UAV-001';
        
        const stats = await missionService.getMissionStatistics(uavId);
        
        res.json(stats);
    } catch (error) {
        console.error('Error getting mission statistics:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * PUT /api/missions/:id/complete
 * Complete a mission
 */
router.put('/:id/complete', async (req, res) => {
    try {
        const mission = await missionService.completeMission(req.params.id);
        
        if (!mission) {
            return res.status(404).json({
                error: 'Mission not found'
            });
        }
        
        // Emit WebSocket event
        req.io.emit('mission_completed', {
            mission: mission,
            timestamp: new Date().toISOString()
        });
        
        res.json(mission);
    } catch (error) {
        console.error('Error completing mission:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

module.exports = router;