/**
 * Survivor Routes
 * Handles survivor management endpoints
 */

const express = require('express');
const router = express.Router();
const survivorService = require('../services/survivorService');

/**
 * GET /api/survivors
 * Get all survivors with optional filtering
 */
router.get('/', async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            uavId: req.query.uavId,
            minConfidence: req.query.minConfidence ? parseFloat(req.query.minConfidence) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
            since: req.query.since
        };

        const survivors = await survivorService.getAllSurvivors(filters);
        
        res.json(survivors);
    } catch (error) {
        console.error('Error getting survivors:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * GET /api/survivors/:id
 * Get survivor by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const survivor = await survivorService.getSurvivorById(req.params.id);
        
        if (!survivor) {
            return res.status(404).json({
                error: 'Survivor not found'
            });
        }
        
        res.json(survivor);
    } catch (error) {
        console.error('Error getting survivor:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * PUT /api/survivors/:id/rescue
 * Mark survivor as rescued
 */
router.put('/:id/rescue', async (req, res) => {
    try {
        const { rescuedBy } = req.body;
        
        const survivor = await survivorService.markAsRescued(req.params.id, rescuedBy);
        
        console.log(`✅ Survivor ${req.params.id} marked as rescued`);
        
        // Emit WebSocket event
        req.io.emit('survivor_rescued', {
            survivor: survivor,
            rescuedBy: rescuedBy,
            timestamp: new Date().toISOString()
        });
        
        res.json(survivor);
    } catch (error) {
        console.error('Error marking survivor as rescued:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * PUT /api/survivors/:id
 * Update survivor information
 */
router.put('/:id', async (req, res) => {
    try {
        const updates = req.body;
        
        const survivor = await survivorService.updateSurvivor(req.params.id, updates);
        
        // Emit WebSocket event
        req.io.emit('survivor_updated', {
            survivor: survivor,
            timestamp: new Date().toISOString()
        });
        
        res.json(survivor);
    } catch (error) {
        console.error('Error updating survivor:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * DELETE /api/survivors/:id
 * Delete survivor (for false positives)
 */
router.delete('/:id', async (req, res) => {
    try {
        const success = await survivorService.deleteSurvivor(req.params.id);
        
        if (!success) {
            return res.status(404).json({
                error: 'Survivor not found'
            });
        }
        
        console.log(`🗑️ Survivor ${req.params.id} deleted`);
        
        // Emit WebSocket event
        req.io.emit('survivor_deleted', {
            survivorId: req.params.id,
            timestamp: new Date().toISOString()
        });
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting survivor:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * GET /api/survivors/stats
 * Get survivor statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await survivorService.getStatistics();
        res.json(stats);
    } catch (error) {
        console.error('Error getting survivor statistics:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

module.exports = router;