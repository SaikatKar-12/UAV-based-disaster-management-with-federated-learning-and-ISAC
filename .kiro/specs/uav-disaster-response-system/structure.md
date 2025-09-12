# UAV Disaster Response System - Project Structure

## 🏗️ Current Implementation Structure

```
uav-disaster-response-system/
├── README.md
├── .gitignore
│
├── backend/                          # Node.js Express Backend
│   ├── package.json
│   ├── src/
│   │   ├── app.js                    # Main Express app
│   │   ├── server.js                 # Server entry point
│   │   ├── services/
│   │   │   ├── isacService.js        # ISAC communication logic
│   │   │   ├── survivorService.js    # Survivor management
│   │   │   └── missionService.js     # Mission tracking & telemetry
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT authentication
│   │   │   └── errorHandler.js       # Error handling middleware
│   │   ├── routes/
│   │   │   ├── uav.js                # UAV data ingestion & status
│   │   │   ├── survivors.js          # Survivor CRUD operations
│   │   │   ├── auth.js               # Authentication endpoints
│   │   │   ├── missions.js           # Mission management
│   │   │   └── isac.js               # ISAC status endpoints
│   │   ├── websocket/
│   │   │   └── socketHandler.js      # WebSocket event handling
│   │   └── database/
│   │       ├── connection.js         # SQLite connection
│   │       └── init.js               # Database initialization
│
├── frontend/                         # React Frontend Application
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── index.js                  # React app entry point
│   │   ├── App.js                    # Main App with routing
│   │   ├── App.css                   # Global styles
│   │   ├── index.css                 # Base styles
│   │   ├── components/
│   │   │   ├── home/                 # Landing Page Components
│   │   │   │   ├── HomePage.js       # Main landing page
│   │   │   │   └── HomePage.css      # Landing page styles
│   │   │   ├── common/               # Shared Components
│   │   │   │   ├── Header.js         # Dashboard header
│   │   │   │   ├── Navigation.js     # Home/Dashboard navigation
│   │   │   │   ├── ErrorBoundary.js  # Error handling wrapper
│   │   │   │   ├── ConnectionStatus.js # Backend connection status
│   │   │   │   └── NotificationContainer.js # Toast notifications
│   │   │   └── dashboard/            # Dashboard Components
│   │   │       ├── Dashboard.js      # Main dashboard layout
│   │   │       ├── MapComponent.js   # Interactive Leaflet map
│   │   │       ├── SurvivorList.js   # Survivor management table
│   │   │       ├── ISACStatus.js     # ISAC mode indicator
│   │   │       ├── UAVStatus.js      # UAV telemetry display
│   │   │       └── MissionStats.js   # Mission statistics
│   │   ├── services/
│   │   │   └── api.js                # API client with axios
│   │   └── context/
│   │       ├── AppContext.js         # Global app state management
│   │       └── WebSocketContext.js   # WebSocket connection context
│
├── js-simulation/                    # JavaScript UAV Simulation
│   ├── package.json
│   ├── README.md
│   ├── mainSimulation.js             # Main simulation orchestrator
│   ├── config/
│   │   └── simulationConfig.js       # Simulation parameters
│   ├── isac/
│   │   ├── determineISACMode.js      # ISAC mode calculation
│   │   ├── calculatePathLoss.js      # RF signal propagation
│   │   └── simulateDataTransmission.js # Adaptive data streaming
│   ├── uav/
│   │   ├── simulateUAVMovement.js    # UAV flight patterns
│   │   └── simulateSensorData.js     # Camera/AI detection simulation
│   └── environment/
│       └── simulateEnvironment.js    # Environmental factors simulation
│
└── .kiro/                            # Kiro IDE Configuration
    └── specs/
        └── uav-disaster-response-system/
            ├── requirements.md       # Project requirements
            ├── design.md            # System design document
            ├── tasks.md             # Implementation tasks
            └── structure.md         # This file
```

## 🚀 Application Architecture

### **Frontend Routes**
- **`/`** - Landing page with project overview, features, and technology stack
- **`/dashboard`** - Real-time UAV monitoring and rescue coordination interface

### **Backend API Endpoints**
- **`POST /api/uav/data`** - Receive UAV telemetry and sensor data
- **`GET /api/uav/status`** - Get current UAV status and telemetry
- **`GET /api/survivors`** - Retrieve survivor detection data
- **`PUT /api/survivors/:id/rescue`** - Mark survivor as rescued
- **`GET /api/isac/status`** - Get ISAC communication status
- **`GET /api/missions/stats`** - Get mission statistics

### **WebSocket Events**
- **`survivor_detected`** - New survivor detection alert
- **`isac_mode_changed`** - ISAC communication mode update
- **`uav_data_update`** - Real-time UAV telemetry update
- **`survivor_rescued`** - Survivor rescue confirmation

### **Database Schema**
- **`survivors`** - Survivor detection records with coordinates and confidence
- **`missions`** - Mission tracking with start/end times and statistics
- **`mission_telemetry`** - UAV telemetry history (position, battery, ISAC)
- **`isac_status`** - ISAC communication mode history

## 🛠️ Technology Stack

### **Frontend**
- **React.js** - Component-based UI framework
- **React Router** - Client-side routing
- **Leaflet** - Interactive mapping
- **WebSocket** - Real-time communication
- **CSS3** - Modern styling with animations

### **Backend**
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Socket.io** - WebSocket implementation
- **SQLite** - Embedded database
- **CORS** - Cross-origin resource sharing

### **Simulation**
- **JavaScript** - UAV and ISAC simulation
- **HTTP Client** - Backend communication
- **Mathematical Models** - RF propagation and path loss

## 📱 User Interface Features

### **Landing Page**
- Modern hero section with gradient animations
- Project mission, vision, and impact statistics
- Detailed feature showcase (6 key capabilities)
- Technology stack overview
- Professional branding and call-to-action

### **Dashboard**
- Real-time UAV tracking on interactive map
- Live survivor detection and management
- ISAC communication status monitoring
- Mission statistics and progress tracking
- WebSocket-powered real-time updates
- Responsive design for desktop and mobile

## 🔄 Data Flow

1. **Simulation** generates realistic UAV movement and sensor data
2. **ISAC Algorithm** determines communication mode based on signal strength
3. **HTTP POST** sends filtered data to backend based on ISAC mode
4. **Backend** processes data, updates database, and broadcasts via WebSocket
5. **Frontend** receives real-time updates and displays on dashboard
6. **Users** monitor operations and coordinate rescue efforts

## 🎯 Key Capabilities

- **Adaptive Communication** - ISAC technology adjusts data transmission
- **Real-time Tracking** - Live UAV position and status monitoring
- **Survivor Detection** - AI-powered detection with confidence scoring
- **Mission Coordination** - Comprehensive rescue operation management
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Professional UI** - Modern, intuitive interface for emergency responders
