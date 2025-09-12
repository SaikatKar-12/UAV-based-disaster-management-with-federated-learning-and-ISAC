/**
 * Survivor Service
 * Handles survivor detection data management
 */

const { v4: uuidv4 } = require('uuid');
const db = require('../database/connection');

class SurvivorService {
    /**
     * Create a new survivor detection
     * @param {Object} survivorData - Survivor detection data
     * @returns {Object} Created survivor record
     */
    async createSurvivor(survivorData) {
        const {
            id = uuidv4(),
            coordinates,
            confidence,
            detectionType = 'human',
            uavId,
            timestamp = new Date().toISOString(),
            status = 'detected',
            additionalInfo = null
        } = survivorData;
        
        // Validate required fields
        if (!coordinates || !coordinates.lat || !coordinates.lng) {
            throw new Error('Invalid coordinates provided');
        }
        
        if (confidence < 0 || confidence > 1) {
            throw new Error('Confidence must be between 0 and 1');
        }
        
        // Check if survivor already exists (prevent duplicates)
        const existing = await this.getSurvivorById(id);
        if (existing) {
            console.log(`Survivor ${id} already exists, updating...`);
            return await this.updateSurvivor(id, { confidence, timestamp });
        }
        
        // Insert new survivor
        const query = `
            INSERT INTO survivors (
                id, lat, lng, confidence, detection_type, uav_id, 
                timestamp, status, additional_info, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            id,
            coordinates.lat,
            coordinates.lng,
            confidence,
            detectionType,
            uavId,
            timestamp,
            status,
            additionalInfo,
            new Date().toISOString()
        ];
        
        await db.run(query, params);
        
        return await this.getSurvivorById(id);
    }
    
    /**
     * Get survivor by ID
     * @param {string} survivorId - Survivor ID
     * @returns {Object|null} Survivor record or null
     */
    async getSurvivorById(survivorId) {
        const query = 'SELECT * FROM survivors WHERE id = ?';
        const survivor = await db.get(query, [survivorId]);
        
        if (survivor) {
            return this.formatSurvivor(survivor);
        }
        
        return null;
    }
    
    /**
     * Get all survivors with optional filtering
     * @param {Object} filters - Filter options
     * @returns {Array} Array of survivor records
     */
    async getAllSurvivors(filters = {}) {
        let query = 'SELECT * FROM survivors';
        const params = [];
        const conditions = [];
        
        // Apply filters
        if (filters.status) {
            conditions.push('status = ?');
            params.push(filters.status);
        }
        
        if (filters.uavId) {
            conditions.push('uav_id = ?');
            params.push(filters.uavId);
        }
        
        if (filters.minConfidence) {
            conditions.push('confidence >= ?');
            params.push(filters.minConfidence);
        }
        
        if (filters.since) {
            conditions.push('timestamp >= ?');
            params.push(filters.since);
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY timestamp DESC';
        
        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(filters.limit);
        }
        
        const survivors = await db.all(query, params);
        return survivors.map(survivor => this.formatSurvivor(survivor));
    }
    
    /**
     * Update survivor status (e.g., mark as rescued)
     * @param {string} survivorId - Survivor ID
     * @param {Object} updates - Fields to update
     * @returns {Object} Updated survivor record
     */
    async updateSurvivor(survivorId, updates) {
        const allowedFields = ['status', 'confidence', 'additional_info', 'timestamp'];
        const setClause = [];
        const params = [];
        
        // Build update query
        for (const [field, value] of Object.entries(updates)) {
            const dbField = field === 'additionalInfo' ? 'additional_info' : field;
            if (allowedFields.includes(dbField)) {
                setClause.push(`${dbField} = ?`);
                params.push(value);
            }
        }
        
        if (setClause.length === 0) {
            throw new Error('No valid fields to update');
        }
        
        // Add updated_at timestamp
        setClause.push('updated_at = ?');
        params.push(new Date().toISOString());
        
        // Add survivor ID for WHERE clause
        params.push(survivorId);
        
        const query = `UPDATE survivors SET ${setClause.join(', ')} WHERE id = ?`;
        
        const result = await db.run(query, params);
        
        if (result.changes === 0) {
            throw new Error('Survivor not found');
        }
        
        return await this.getSurvivorById(survivorId);
    }
    
    /**
     * Mark survivor as rescued
     * @param {string} survivorId - Survivor ID
     * @param {string} rescuedBy - Who rescued the survivor
     * @returns {Object} Updated survivor record
     */
    async markAsRescued(survivorId, rescuedBy = null) {
        const updates = {
            status: 'rescued',
            additional_info: rescuedBy ? `Rescued by: ${rescuedBy}` : 'Rescued',
            timestamp: new Date().toISOString()
        };
        
        return await this.updateSurvivor(survivorId, updates);
    }
    
    /**
     * Get survivor statistics
     * @returns {Object} Statistics object
     */
    async getStatistics() {
        const queries = {
            total: 'SELECT COUNT(*) as count FROM survivors',
            detected: 'SELECT COUNT(*) as count FROM survivors WHERE status = "detected"',
            rescued: 'SELECT COUNT(*) as count FROM survivors WHERE status = "rescued"',
            falsePositive: 'SELECT COUNT(*) as count FROM survivors WHERE status = "false_positive"',
            avgConfidence: 'SELECT AVG(confidence) as avg FROM survivors WHERE status = "detected"',
            recentDetections: 'SELECT COUNT(*) as count FROM survivors WHERE timestamp >= datetime("now", "-1 hour")'
        };
        
        const stats = {};
        
        for (const [key, query] of Object.entries(queries)) {
            const result = await db.get(query);
            stats[key] = result.count !== undefined ? result.count : result.avg;
        }
        
        return stats;
    }
    
    /**
     * Delete survivor (for false positives)
     * @param {string} survivorId - Survivor ID
     * @returns {boolean} Success status
     */
    async deleteSurvivor(survivorId) {
        const query = 'DELETE FROM survivors WHERE id = ?';
        const result = await db.run(query, [survivorId]);
        
        return result.changes > 0;
    }
    
    /**
     * Format survivor record for API response
     * @param {Object} survivor - Raw survivor record from database
     * @returns {Object} Formatted survivor record
     */
    formatSurvivor(survivor) {
        return {
            id: survivor.id,
            coordinates: {
                lat: survivor.lat,
                lng: survivor.lng
            },
            confidence: survivor.confidence,
            detectionType: survivor.detection_type,
            uavId: survivor.uav_id,
            timestamp: survivor.timestamp,
            status: survivor.status,
            additionalInfo: survivor.additional_info,
            createdAt: survivor.created_at,
            updatedAt: survivor.updated_at
        };
    }
}

module.exports = new SurvivorService();