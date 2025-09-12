/**
 * Server Entry Point
 * Starts the Express.js server for UAV disaster response system
 */

require('dotenv').config();
const Application = require('./app');

// Initialize database
const { initializeDatabase } = require('./database/init');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function startServer() {
    try {
        console.log('=== UAV Disaster Response Backend Server ===');
        console.log(`Environment: ${NODE_ENV}`);
        console.log(`Starting server on port ${PORT}...`);
        
        // Initialize database
        console.log('Initializing database...');
        await initializeDatabase();
        console.log('Database initialized successfully');
        
        // Create application instance
        const application = new Application();
        const server = application.getServer();
        
        // Start server
        server.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
            console.log(`✅ WebSocket server ready for connections`);
            console.log(`✅ API endpoints available at http://localhost:${PORT}/api`);
            console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
            console.log('\n🚁 Ready to receive UAV data!');
            
            if (NODE_ENV === 'development') {
                console.log('\n📡 To test with simulation:');
                console.log('   cd js-simulation && node mainSimulation.js');
            }
        });
        
        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('\nReceived SIGTERM, shutting down gracefully...');
            server.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        });
        
        process.on('SIGINT', () => {
            console.log('\nReceived SIGINT, shutting down gracefully...');
            server.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        });
        
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();