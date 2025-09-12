/**
 * ISAC Service
 * Handles ISAC status tracking and communication mode management
 */

const db = require('../database/connection');

class ISACService {
    /**
     * Update ISAC status
     * @param {Object} isacData - ISAC status data
     * @returns {Object} Created ISAC status record
     */
    async updateISACStatus(isacData) {
        const {
            uavId,
            mode,
            signalStrength,
            dataRate,
            timestamp = new Date().toISOString()
        } = isacData;

        // Validate mode
        const validModes = ['good', 'medium', 'weak'];
        if (!validModes.includes(mode)) {
            throw new Error('Invalid ISAC mode');
        }

        // Validate signal strength
        if (signalStrength < 0 || signalStrength > 100) {
            throw new Error('Signal strength must be between 0 and 100');
        }

        const query = `
            INSERT INTO isac_status (
                uav_id, mode, signal_strength, data_rate, timestamp, created_at
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;

        const params = [
            uavId,
            mode,
            signalStrength,
            dataRate,
            timestamp,
            new Date().toISOString()
        ];

        await db.run(query, params);

        return {
            uavId,
            mode,
            signalStrength,
            dataRate,
            timestamp
        };
    }

    /**
     * Get latest ISAC status for UAV
     * @param {string} uavId - UAV ID
     * @returns {Object|null} Latest ISAC status or null
     */
    async getLatestISACStatus(uavId) {
        const query = `
            SELECT * FROM isac_status 
            WHERE uav_id = ? 
            ORDER BY timestamp DESC 
            LIMIT 1
        `;

        const status = await db.get(query, [uavId]);

        if (status) {
            return {
                uavId: status.uav_id,
                mode: status.mode,
                signalStrength: status.signal_strength,
                dataRate: status.data_rate,
                timestamp: status.timestamp,
                availableStreams: this.getAvailableStreams(status.mode)
            };
        }

        return null;
    }

    /**
     * Get ISAC status history
     * @param {string} uavId - UAV ID
     * @param {number} limit - Number of records to fetch
     * @returns {Array} Array of ISAC status records
     */
    async getISACStatusHistory(uavId, limit = 50) {
        const query = `
            SELECT * FROM isac_status 
            WHERE uav_id = ? 
            ORDER BY timestamp DESC 
            LIMIT ?
        `;

        const statusHistory = await db.all(query, [uavId, limit]);

        return statusHistory.map(status => ({
            uavId: status.uav_id,
            mode: status.mode,
            signalStrength: status.signal_strength,
            dataRate: status.data_rate,
            timestamp: status.timestamp,
            availableStreams: this.getAvailableStreams(status.mode)
        }));
    }

    /**
     * Get ISAC statistics
     * @param {string} uavId - UAV ID (optional)
     * @returns {Object} ISAC statistics
     */
    async getISACStatistics(uavId = null) {
        const baseQuery = `
            SELECT 
                mode,
                COUNT(*) as count,
                AVG(signal_strength) as avg_signal_strength,
                AVG(data_rate) as avg_data_rate
            FROM isac_status
        `;

        let query = baseQuery;
        let params = [];

        if (uavId) {
            query += ' WHERE uav_id = ?';
            params.push(uavId);
        }

        query += ' GROUP BY mode';

        const modeStats = await db.all(query, params);

        // Get total counts
        const totalQuery = uavId 
            ? 'SELECT COUNT(*) as total FROM isac_status WHERE uav_id = ?'
            : 'SELECT COUNT(*) as total FROM isac_status';
        
        const totalResult = await db.get(totalQuery, uavId ? [uavId] : []);
        const total = totalResult.total;

        // Format statistics
        const stats = {
            total: total,
            modes: {},
            averageSignalStrength: 0,
            averageDataRate: 0
        };

        let totalSignalStrength = 0;
        let totalDataRate = 0;

        modeStats.forEach(stat => {
            stats.modes[stat.mode] = {
                count: stat.count,
                percentage: total > 0 ? (stat.count / total * 100) : 0,
                averageSignalStrength: stat.avg_signal_strength,
                averageDataRate: stat.avg_data_rate
            };

            totalSignalStrength += stat.avg_signal_strength * stat.count;
            totalDataRate += stat.avg_data_rate * stat.count;
        });

        if (total > 0) {
            stats.averageSignalStrength = totalSignalStrength / total;
            stats.averageDataRate = totalDataRate / total;
        }

        return stats;
    }

    /**
     * Get available streams based on ISAC mode
     * @param {string} mode - ISAC mode
     * @returns {Object} Available streams
     */
    getAvailableStreams(mode) {
        switch (mode.toLowerCase()) {
            case 'good':
                return {
                    video: true,
                    detections: true,
                    modelUpdates: true
                };
            case 'medium':
                return {
                    video: true,
                    detections: true,
                    modelUpdates: false
                };
            case 'weak':
                return {
                    video: false,
                    detections: true,
                    modelUpdates: false
                };
            default:
                return {
                    video: false,
                    detections: false,
                    modelUpdates: false
                };
        }
    }

    /**
     * Clean old ISAC status records
     * @param {number} daysToKeep - Number of days to keep records
     * @returns {number} Number of deleted records
     */
    async cleanOldRecords(daysToKeep = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const query = 'DELETE FROM isac_status WHERE timestamp < ?';
        const result = await db.run(query, [cutoffDate.toISOString()]);

        console.log(`Cleaned ${result.changes} old ISAC status records`);
        return result.changes;
    }
}

module.exports = new ISACService();