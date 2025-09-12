# 🚁 UAV Disaster Response System

> Next-generation disaster response technology powered by intelligent UAVs and adaptive ISAC communication

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Status](https://img.shields.io/badge/Status-Active-success.svg)]()

## 🌟 Overview

The UAV Disaster Response System revolutionizes emergency response through intelligent autonomous UAVs equipped with adaptive ISAC (Integrated Sensing and Communication) technology. This system provides real-time situational awareness, survivor detection, and rescue coordination capabilities for disaster response teams.

### 🎯 Key Features

- **🚁 Autonomous UAV Fleet** - Intelligent drones with adaptive navigation
- **📡 ISAC Technology** - Adaptive communication based on signal strength
- **🎯 AI-Powered Detection** - Machine learning survivor detection with confidence scoring
- **📊 Real-Time Dashboard** - Live monitoring and coordination interface
- **🔄 Adaptive Communication** - Smart data transmission optimization
- **⚡ Emergency Response** - Rapid deployment and instant alerts

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Simulation    │───▶│     Backend     │───▶│    Frontend     │
│   (UAV + ISAC)  │    │  (Node.js API)  │    │   (React App)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────▶│    Database     │◀─────────────┘
                        │    (SQLite)     │
                        └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Git** for version control
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/uav-disaster-response-system.git
   cd uav-disaster-response-system
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   
   # Install simulation dependencies
   cd ../js-simulation
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment template
   cp backend/.env.example backend/.env
   
   # Edit the .env file with your configuration
   ```

4. **Initialize the database**
   ```bash
   cd backend
   npm run init-db
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm start
   ```
   Server will run on `http://localhost:3000`

2. **Start the frontend application**
   ```bash
   cd frontend
   npm start
   ```
   Application will open at `http://localhost:3001`

3. **Start the UAV simulation**
   ```bash
   cd js-simulation
   node mainSimulation.js
   ```

4. **Access the application**
   - **Home Page**: `http://localhost:3001/` - Project overview and features
   - **Dashboard**: `http://localhost:3001/dashboard` - Live UAV monitoring

## 📱 User Interface

### 🏠 Landing Page
- **Modern Design** - Trendy gradient backgrounds and animations
- **Project Overview** - Mission, vision, and impact statistics
- **Feature Showcase** - Detailed capability descriptions
- **Technology Stack** - Complete technical overview

### 📊 Dashboard
- **Real-Time Map** - Interactive UAV and survivor tracking
- **UAV Status** - Battery, location, ISAC mode, signal strength
- **Survivor Management** - Detection list with rescue coordination
- **Mission Statistics** - Live progress and performance metrics
- **Connection Status** - Backend and WebSocket connectivity

## 🛠️ Technology Stack

### Frontend
- **React.js** - Component-based UI framework
- **React Router** - Client-side routing
- **Leaflet** - Interactive mapping library
- **WebSocket** - Real-time communication
- **CSS3** - Modern styling with animations

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **Socket.io** - WebSocket implementation
- **SQLite** - Embedded database
- **CORS** - Cross-origin resource sharing

### Simulation
- **JavaScript** - UAV and ISAC simulation engine
- **HTTP Client** - Backend communication
- **Mathematical Models** - RF propagation and path loss calculations

## 📡 API Documentation

### UAV Endpoints
- `POST /api/uav/data` - Receive UAV telemetry and sensor data
- `GET /api/uav/status` - Get current UAV status and telemetry
- `GET /api/uav/telemetry` - Get UAV telemetry history

### Survivor Endpoints
- `GET /api/survivors` - Retrieve survivor detection data
- `GET /api/survivors/:id` - Get specific survivor details
- `PUT /api/survivors/:id/rescue` - Mark survivor as rescued

### Mission Endpoints
- `GET /api/missions/stats` - Get mission statistics
- `GET /api/missions` - Get mission history

### ISAC Endpoints
- `GET /api/isac/status` - Get ISAC communication status

### WebSocket Events
- `survivor_detected` - New survivor detection alert
- `isac_mode_changed` - ISAC communication mode update
- `uav_data_update` - Real-time UAV telemetry update
- `survivor_rescued` - Survivor rescue confirmation

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DATABASE_PATH=./uav_rescue.db

# CORS Configuration
CORS_ORIGIN=http://localhost:3001

# WebSocket Configuration
WEBSOCKET_PORT=3000
```

### Simulation Parameters

```javascript
// js-simulation/config/simulationConfig.js
{
  uav: {
    startPosition: { lat: 12.9716, lng: 77.5946, altitude: 50 },
    speed: 10, // m/s
    batteryCapacity: 100,
    flightPattern: 'spiral'
  },
  isac: {
    baseStationPosition: { lat: 12.9716, lng: 77.5946 },
    transmissionPower: 20, // dBm
    frequency: 2.4e9 // Hz
  }
}
```

## 🎮 ISAC Technology

### Communication Modes

- **🟢 GOOD Mode** (Signal > 70%)
  - Full video streaming
  - High-resolution detection data
  - Real-time model updates

- **🟡 MEDIUM Mode** (Signal 30-70%)
  - Compressed video
  - Essential detection data
  - Periodic updates

- **🔴 WEAK Mode** (Signal < 30%)
  - Critical data only
  - Survivor coordinates
  - Emergency alerts

### Adaptive Algorithm

The ISAC system automatically adjusts data transmission based on:
- Signal strength and quality
- Distance from base station
- Environmental conditions
- Network congestion

## 📊 Data Flow

1. **UAV Simulation** generates realistic flight patterns and sensor data
2. **ISAC Algorithm** determines optimal communication mode
3. **Data Filtering** adapts payload based on signal conditions
4. **Backend Processing** stores data and broadcasts updates
5. **Real-Time Dashboard** displays live information
6. **Rescue Coordination** enables team collaboration

## 🧪 Development

### Project Structure

```
uav-disaster-response-system/
├── backend/                 # Node.js Express API
├── frontend/               # React application
├── js-simulation/          # UAV and ISAC simulation
├── docs/                   # Documentation
└── README.md              # This file
```

### Development Commands

```bash
# Backend development
cd backend
npm run dev          # Start with nodemon
npm run test         # Run tests
npm run lint         # Code linting

# Frontend development
cd frontend
npm start            # Development server
npm run build        # Production build
npm test             # Run tests

# Simulation
cd js-simulation
node mainSimulation.js    # Start simulation
```

### Testing

```bash
# Run all tests
npm test

# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## 🚀 Deployment

### Production Build

```bash
# Build frontend
cd frontend
npm run build

# Start production server
cd backend
NODE_ENV=production npm start
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow existing code style and conventions
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **ISAC Technology** - Integrated Sensing and Communication research
- **Disaster Response Teams** - Real-world requirements and feedback
- **Open Source Community** - Libraries and frameworks used

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/uav-disaster-response-system/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/uav-disaster-response-system/discussions)
- **Documentation**: [Project Wiki](https://github.com/yourusername/uav-disaster-response-system/wiki)

## 🔮 Roadmap

- [ ] **Multi-UAV Coordination** - Fleet management capabilities
- [ ] **Advanced AI Models** - Enhanced detection algorithms
- [ ] **Mobile Application** - Field team mobile interface
- [ ] **Cloud Integration** - Scalable cloud deployment
- [ ] **Machine Learning** - Federated learning implementation
- [ ] **3D Visualization** - Enhanced mapping and visualization

---

<div align="center">

**🚁 Built for saving lives through technology 🚁**

[Website](https://your-demo-site.com) • [Documentation](https://docs.your-site.com) • [Demo](https://demo.your-site.com)

</div>