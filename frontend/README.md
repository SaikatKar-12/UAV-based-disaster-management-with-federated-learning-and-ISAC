# UAV Disaster Response Frontend

React-based dashboard for real-time UAV disaster response coordination.

## Features

- **Real-time Map**: Interactive map showing UAV position, base station, and survivor locations
- **ISAC Status**: Live communication mode and signal strength monitoring
- **Survivor Management**: List and manage detected survivors with rescue status
- **UAV Monitoring**: Battery level, position, and system status
- **Mission Statistics**: Real-time mission progress and success metrics
- **WebSocket Integration**: Live updates from backend simulation

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## Configuration

The frontend automatically connects to:
- **Backend API**: `http://localhost:3000/api`
- **WebSocket**: `http://localhost:3000`

To change these, set environment variables:
```bash
REACT_APP_API_URL=http://your-backend:3000/api
REACT_APP_BACKEND_URL=http://your-backend:3000
```

## Components

### Dashboard Components
- `Dashboard.js` - Main dashboard layout
- `MapComponent.js` - Interactive Leaflet map
- `SurvivorList.js` - Survivor management interface
- `ISACStatus.js` - Communication status display
- `UAVStatus.js` - UAV monitoring panel
- `MissionStats.js` - Mission statistics

### Context Providers
- `AppContext.js` - Global application state
- `WebSocketContext.js` - Real-time communication

## Usage

1. Start the backend server
2. Start the frontend: `npm start`
3. Open `http://localhost:3001`
4. Run the simulation to see live data

The dashboard will show:
- UAV moving on the map
- ISAC mode changes (Good/Medium/Weak)
- Survivor detections appearing in real-time
- Mission statistics updating live