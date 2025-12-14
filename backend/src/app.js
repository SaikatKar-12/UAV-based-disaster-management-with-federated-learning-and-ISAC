/**
 * Express.js Application Setup
 * Main application configuration for UAV disaster response backend
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

// Import routes
const uavRoutes = require('./routes/uav');
const survivorRoutes = require('./routes/survivors');
const authRoutes = require('./routes/auth');
const missionRoutes = require('./routes/missions');
const isacRoutes = require('./routes/isac');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

// Import WebSocket handler
const socketHandler = require('./websocket/socketHandler');

class Application {
    constructor() {
        this.app = express();

        // Create HTTP server and WebSocket server with permissive CORS
        this.server = createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: '*',
                methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                credentials: false
            }
        });
        
        this.configureMiddleware();
        this.configureRoutes();
        this.setupWebSocket();
        this.setupErrorHandling();
    }
    
    configureMiddleware() {

        // Security middleware
        this.app.use(helmet());
        
        // CORS configuration for HTTP API - allow all origins
        this.app.use(cors({
            origin: '*',
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"],
            credentials: false
        }));
        
        // Logging
        this.app.use(morgan('combined'));
        
        // Body parsing - Increased limits for simulation data
        this.app.use(express.json({ limit: '10mb' }));

        // Serve uploaded files (including UAV images)
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        this.app.use('/uploads', express.static(uploadsDir));

        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
        
        // Make io available to routes
        this.app.use((req, res, next) => {
            req.io = this.io;
            next();
        });
    }
    
    configureRoutes() {
        // Health check route
        this.app.get('/api/health', (req, res) => {
            res.json({ 
                status: 'ok', 
                timestamp: new Date().toISOString(),
                service: 'uav-disaster-response-backend'
            });
        });

        // Admin: list UAV images saved on backend
        this.app.get('/api/admin/images', (req, res) => {
            try {
                const imagesDir = path.join(__dirname, '..', 'uploads', 'uav-images');
                if (!fs.existsSync(imagesDir)) {
                    return res.json({ images: [] });
                }

                const files = fs.readdirSync(imagesDir).filter(f =>
                    /\.(jpg|jpeg|png)$/i.test(f)
                );

                const images = files.map(fileName => ({
                    fileName,
                    url: `/uploads/uav-images/${fileName}`
                }));

                res.json({ images });
            } catch (error) {
                console.error('Error listing admin images:', error);
                res.status(500).json({ error: 'Failed to list images' });
            }
        });

        // API routes
        this.app.use('/api/uav', uavRoutes);
        this.app.use('/api/survivors', survivorRoutes);
        this.app.use('/api/auth', authRoutes);
        this.app.use('/api/missions', missionRoutes);
        this.app.use('/api/isac', isacRoutes);
        
        // Root endpoint
        this.app.get('/', (req, res) => {
            res.json({
                message: 'UAV Disaster Response System API',
                version: '1.0.0',
                endpoints: {
                    health: '/api/health',
                    uav: '/api/uav',
                    survivors: '/api/survivors',
                    auth: '/api/auth',
                    missions: '/api/missions',
                    isac: '/api/isac'
                }
            });
        });
    }
    
    setupWebSocket() {
        // Initialize WebSocket handling
        socketHandler(this.io);
        
        console.log('WebSocket server initialized');
    }
    
    setupErrorHandling() {
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Endpoint not found',
                path: req.originalUrl,
                method: req.method
            });
        });
        
        // Global error handler
        this.app.use(errorHandler);
    }
    
    getApp() {
        return this.app;
    }
    
    getServer() {
        return this.server;
    }
    
    getIO() {
        return this.io;
    }
}

module.exports = Application;