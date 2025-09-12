/**
 * Mission Service
 * Handles mission tracking and telemetry data
 */

const { v4: uuidv4 } = require('uuid');
const db = require('../database/connection');

class MissionService {
    /**
     * Update mission data with UAV telemetry
     * @param {Object} missionData - Mission update data
     * @returns {Object} Mission update result
     */
    async updateMissionData(missionData) {
        const {
            uavId,
            location,
            timestamp,
            detectionsCount = 0,
            isacMode,
            signalStrength,
            batteryLevel
        } = missionData;

        // Get or create active mission for this UAV
        let mission = await this.getActiveMission(uavId);
        
        if (!mission) {
            mission = await this.createMission(uavId);
        }

        // Add telemetry record
        await this.addTelemetryRecord({
            missionId: mission.id,
            uavId,
            location,
            timestamp,
            isacMode,
            signalStrength,
            batteryLevel
        });

        // Update mission statistics
        if (detectionsCount > 0) {
            await this.updateMissionStats(mission.id, {
                survivorsDetected: detectionsCount
            });
        }

        return mission;
    }

    /**
     * Get active mission for UAV
     * @param {string} uavId - UAV ID
     * @returns {Object|null} Active mission or null
     */
    async getActiveMission(uavId) {
        const query = `
            SELECT * FROM missions 
            WHERE uav_id = ? AND status = 'active' 
            ORDER BY start_time DESC 
            LIMIT 1
        `;

        const mission = await db.get(query, [uavId]);
        return mission ? this.formatMission(mission) : null;
    }

    /**
     * Create new mission
     * @param {string} uavId - UAV ID
     * @returns {Object} Created mission
     */
    async createMission(uavId) {
        const missionId = uuidv4();
        const now = new Date().toISOString();

        const query = `
            INSERT INTO missions (
                id, uav_id, start_time, status, created_at
            ) VALUES (?, ?, ?, ?, ?)
        `;

        await db.run(query, [missionId, uavId, now, 'active', now]);

        console.log(`🚁 New mission started: ${missionId} for ${uavId}`);

        return {
            id: missionId,
            uavId,
            startTime: now,
            status: 'active',
            survivorsDetected: 0,
            survivorsRescued: 0,
            areaCovered: 0
        };
    }

    /**
     * Add telemetry record
     * @param {Object} telemetryData - Telemetry data
     */
    async addTelemetryRecord(telemetryData) {
        const {
            missionId,
            uavId,
            location,
            timestamp,
            isacMode,
            signalStrength,
            batteryLevel
        } = telemetryData;

        const query = `
            INSERT INTO mission_telemetry (
                mission_id, uav_id, lat, lng, altitude, 
                battery_level, isac_mode, signal_strength, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            missionId,
            uavId,
            location.lat,
            location.lng,
            location.altitude,
            batteryLevel,
            isacMode,
            signalStrength,
            timestamp
        ];

        await db.run(query, params);
    }

    /**
     * Update mission statistics
     * @param {string} missionId - Mission ID
     * @param {Object} updates - Statistics to update
     */
    async updateMissionStats(missionId, updates) {
        const setClause = [];
        const params = [];

        if (updates.survivorsDetected !== undefined) {
            setClause.push('survivors_detected = survivors_detected + ?');
            params.push(updates.survivorsDetected);
        }

        if (updates.survivorsRescued !== undefined) {
            setClause.push('survivors_rescued = survivors_rescued + ?');
            params.push(updates.survivorsRescued);
        }

        if (updates.areaCovered !== undefined) {
            setClause.push('area_covered = ?');
            params.push(updates.areaCovered);
        }

        if (setClause.length === 0) return;

        setClause.push('updated_at = ?');
        params.push(new Date().toISOString());
        params.push(missionId);

        const query = `UPDATE missions SET ${setClause.join(', ')} WHERE id = ?`;
        await db.run(query, params);
    }

    /**
     * Get mission statistics
     * @param {string} uavId - UAV ID
     * @returns {Object} Mission statistics
     */
    async getMissionStatistics(uavId) {
        const mission = await this.getActiveMission(uavId);
        
        if (!mission) {
            return {
                totalDetections: 0,
                survivorsRescued: 0,
                missionDuration: 0,
                areasCovered: 0
            };
        }

        // Calculate mission duration
        const startTime = new Date(mission.startTime);
        const now = new Date();
        const durationSeconds = Math.floor((now - startTime) / 1000);

        return {
            totalDetections: mission.survivorsDetected || 0,
            survivorsRescued: mission.survivorsRescued || 0,
            missionDuration: durationSeconds,
            areasCovered: mission.areaCovered || 0
        };
    }

    /**
     * Get latest telemetry for UAV
     * @param {string} uavId - UAV ID
     * @returns {Object|null} Latest telemetry record or null
     */
    async getLatestTelemetry(uavId) {
        const query = `
            SELECT * FROM mission_telemetry 
            WHERE uav_id = ? 
            ORDER BY timestamp DESC 
            LIMIT 1
        `;

        const record = await db.get(query, [uavId]);

        if (!record) return null;

        return {
            missionId: record.mission_id,
            uavId: record.uav_id,
            location: {
                lat: record.lat,
                lng: record.lng,
                altitude: record.altitude
            },
            batteryLevel: record.battery_level,
            isacMode: record.isac_mode,
            signalStrength: record.signal_strength,
            timestamp: record.timestamp
        };
    }

    /**
     * Get telemetry history
     * @param {string} uavId - UAV ID
     * @param {number} limit - Number of records to fetch
     * @returns {Array} Telemetry records
     */
    async getTelemetryHistory(uavId, limit = 50) {
        const query = `
            SELECT * FROM mission_telemetry 
            WHERE uav_id = ? 
            ORDER BY timestamp DESC 
            LIMIT ?
        `;

        const telemetry = await db.all(query, [uavId, limit]);

        return telemetry.map(record => ({
            missionId: record.mission_id,
            uavId: record.uav_id,
            location: {
                lat: record.lat,
                lng: record.lng,
                altitude: record.altitude
            },
            batteryLevel: record.battery_level,
            isacMode: record.isac_mode,
            signalStrength: record.signal_strength,
            timestamp: record.timestamp
        }));
    }

    /**
     * Complete mission
     * @param {string} missionId - Mission ID
     * @returns {Object} Completed mission
     */
    async completeMission(missionId) {
        const now = new Date().toISOString();

        const query = `
            UPDATE missions 
            SET status = 'completed', end_time = ?, updated_at = ? 
            WHERE id = ?
        `;

        await db.run(query, [now, now, missionId]);

        console.log(`✅ Mission completed: ${missionId}`);

        return await this.getMissionById(missionId);
    }

    /**
     * Get mission by ID
     * @param {string} missionId - Mission ID
     * @returns {Object|null} Mission or null
     */
    async getMissionById(missionId) {
        const query = 'SELECT * FROM missions WHERE id = ?';
        const mission = await db.get(query, [missionId]);
        
        return mission ? this.formatMission(mission) : null;
    }

    /**
     * Get all missions
     * @param {Object} filters - Filter options
     * @returns {Array} Array of missions
     */
    async getAllMissions(filters = {}) {
        let query = 'SELECT * FROM missions';
        const params = [];
        const conditions = [];

        if (filters.status) {
            conditions.push('status = ?');
            params.push(filters.status);
        }

        if (filters.uavId) {
            conditions.push('uav_id = ?');
            params.push(filters.uavId);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY start_time DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(filters.limit);
        }

        const missions = await db.all(query, params);
        return missions.map(mission => this.formatMission(mission));
    }

    /**
     * Format mission record for API response
     * @param {Object} mission - Raw mission record from database
     * @returns {Object} Formatted mission record
     */
    formatMission(mission) {
        return {
            id: mission.id,
            uavId: mission.uav_id,
            startTime: mission.start_time,
            endTime: mission.end_time,
            status: mission.status,
            survivorsDetected: mission.survivors_detected || 0,
            survivorsRescued: mission.survivors_rescued || 0,
            areaCovered: mission.area_covered || 0,
            createdAt: mission.created_at,
            updatedAt: mission.updated_at
        };
    }
}

module.exports = new MissionService();