/**
 * Database Connection
 * SQLite database connection with promise wrapper
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/disaster_response.db');

class Database {
    constructor() {
        this.db = null;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(DB_PATH, (err) => {
                if (err) {
                    console.error('Error connecting to database:', err);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database');
                    resolve();
                }
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err);
                        reject(err);
                    } else {
                        console.log('Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                this.connect().then(() => {
                    this._run(sql, params, resolve, reject);
                }).catch(reject);
            } else {
                this._run(sql, params, resolve, reject);
            }
        });
    }

    _run(sql, params, resolve, reject) {
        this.db.run(sql, params, function(err) {
            if (err) {
                console.error('Database run error:', err);
                reject(err);
            } else {
                resolve({
                    id: this.lastID,
                    changes: this.changes
                });
            }
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                this.connect().then(() => {
                    this._get(sql, params, resolve, reject);
                }).catch(reject);
            } else {
                this._get(sql, params, resolve, reject);
            }
        });
    }

    _get(sql, params, resolve, reject) {
        this.db.get(sql, params, (err, row) => {
            if (err) {
                console.error('Database get error:', err);
                reject(err);
            } else {
                resolve(row);
            }
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                this.connect().then(() => {
                    this._all(sql, params, resolve, reject);
                }).catch(reject);
            } else {
                this._all(sql, params, resolve, reject);
            }
        });
    }

    _all(sql, params, resolve, reject) {
        this.db.all(sql, params, (err, rows) => {
            if (err) {
                console.error('Database all error:', err);
                reject(err);
            } else {
                resolve(rows || []);
            }
        });
    }
}

// Create singleton instance
const database = new Database();

// Initialize connection
database.connect().catch(console.error);

module.exports = database;