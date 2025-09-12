/**
 * Database Initialization
 * Sets up SQLite database and creates tables
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database file path
const DB_PATH = path.join(__dirname, '../../data/disaster_response.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

/**
 * Initialize database and create tables
 */
async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('Error opening database:', err);
                reject(err);
                return;
            }
            
            console.log('Connected to SQLite database');
            
            // Create tables
            createTables(db)
                .then(() => {
                    db.close((err) => {
                        if (err) {
                            console.error('Error closing database:', err);
                            reject(err);
                        } else {
                            console.log('Database initialization completed');
                            resolve();
                        }
                    });
                })
                .catch(reject);
        });
    });
}

/**
 * Create all required tables
 */
async function createTables(db) {
    const tables = [
        // Survivors table
        `CREATE TABLE IF NOT EXISTS survivors (
            id TEXT PRIMARY KEY,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            confidence REAL NOT NULL CHECK(confidence >= 0 AND confidence <= 1),
            detection_type TEXT NOT NULL DEFAULT 'human',
            uav_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'detected' CHECK(status IN ('detected', 'rescued', 'false_positive')),
            additional_info TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT
        )`,
        
        // ISAC status table
        `CREATE TABLE IF NOT EXISTS isac_status (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uav_id TEXT NOT NULL,
            mode TEXT NOT NULL CHECK(mode IN ('good', 'medium', 'weak')),
            signal_strength REAL NOT NULL CHECK(signal_strength >= 0 AND signal_strength <= 100),
            data_rate REAL,
            timestamp TEXT NOT NULL,
            created_at TEXT NOT NULL
        )`,
        
        // Missions table
        `CREATE TABLE IF NOT EXISTS missions (
            id TEXT PRIMARY KEY,
            uav_id TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT,
            status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'aborted')),
            survivors_detected INTEGER DEFAULT 0,
            survivors_rescued INTEGER DEFAULT 0,
            area_covered REAL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT
        )`,
        
        // Mission telemetry table
        `CREATE TABLE IF NOT EXISTS mission_telemetry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mission_id TEXT NOT NULL,
            uav_id TEXT NOT NULL,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            altitude REAL NOT NULL,
            battery_level REAL,
            isac_mode TEXT,
            signal_strength REAL,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (mission_id) REFERENCES missions (id)
        )`,
        
        // Users table (for authentication)
        `CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'operator' CHECK(role IN ('admin', 'operator', 'viewer')),
            created_at TEXT NOT NULL,
            updated_at TEXT,
            last_login TEXT
        )`
    ];
    
    // Create indexes
    const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_survivors_timestamp ON survivors(timestamp)',
        'CREATE INDEX IF NOT EXISTS idx_survivors_status ON survivors(status)',
        'CREATE INDEX IF NOT EXISTS idx_survivors_uav_id ON survivors(uav_id)',
        'CREATE INDEX IF NOT EXISTS idx_isac_status_uav_id ON isac_status(uav_id)',
        'CREATE INDEX IF NOT EXISTS idx_isac_status_timestamp ON isac_status(timestamp)',
        'CREATE INDEX IF NOT EXISTS idx_missions_uav_id ON missions(uav_id)',
        'CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status)',
        'CREATE INDEX IF NOT EXISTS idx_telemetry_mission_id ON mission_telemetry(mission_id)',
        'CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON mission_telemetry(timestamp)'
    ];
    
    return new Promise((resolve, reject) => {
        // Execute table creation queries
        const createTablePromises = tables.map(sql => {
            return new Promise((resolve, reject) => {
                db.run(sql, (err) => {
                    if (err) {
                        console.error('Error creating table:', err);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        });
        
        Promise.all(createTablePromises)
            .then(() => {
                // Create indexes
                const createIndexPromises = indexes.map(sql => {
                    return new Promise((resolve, reject) => {
                        db.run(sql, (err) => {
                            if (err) {
                                console.error('Error creating index:', err);
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    });
                });
                
                return Promise.all(createIndexPromises);
            })
            .then(() => {
                console.log('All database tables and indexes created successfully');
                resolve();
            })
            .catch(reject);
    });
}

/**
 * Reset database (for development/testing)
 */
async function resetDatabase() {
    return new Promise((resolve, reject) => {
        // Delete database file if it exists
        if (fs.existsSync(DB_PATH)) {
            fs.unlinkSync(DB_PATH);
            console.log('Database file deleted');
        }
        
        // Reinitialize
        initializeDatabase()
            .then(resolve)
            .catch(reject);
    });
}

module.exports = {
    initializeDatabase,
    resetDatabase,
    DB_PATH
};