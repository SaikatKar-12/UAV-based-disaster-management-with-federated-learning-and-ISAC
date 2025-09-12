# UAV Disaster Response JavaScript Simulation

This is the **JavaScript version** of the UAV-based disaster response system simulation, converted from MATLAB. It implements the complete ISAC (Integrated Sensing and Communication) functionality and works **exactly the same** as the MATLAB version but runs natively in Node.js.

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 14+ installed on your system
- No additional dependencies required (uses built-in Node.js modules)

### **Installation**
```bash
# Clone or navigate to the js-simulation directory
cd js-simulation

# Install dependencies (optional - only for development)
npm install

# Run the simulation
npm start
```

### **Alternative - Direct Run**
```bash
# Run directly with Node.js
node mainSimulation.js
```

## 📊 **What You'll See**

The simulation displays real-time output identical to the MATLAB version:

```
=== UAV Disaster Response ISAC Simulation ===
JavaScript version - Starting simulation...

Simulation configuration loaded:
  Duration: 300 seconds
  Time step: 2 seconds
  Backend URL: http://localhost:3000
  UAV start position: [100, 100, 50]

Environment initialized: urban terrain
UAV initialized at position [100, 100, 50]
Base station initialized at position [0, 0]

Running simulation for 300 seconds...

[    0s] UAV: [ 100.0,  100.0] | ISAC: GOOD   | Signal:  78.3% | TX: ✓
[    2s] UAV: [ 116.0,  106.0] | ISAC: GOOD   | Signal:  76.1% | TX: ✓
[    4s] UAV: [ 132.0,  112.0] | ISAC: MEDIUM | Signal:  68.9% | TX: ✓
[    6s] UAV: [ 148.0,  118.0] | ISAC: MEDIUM | Signal:  61.2% | TX: ✓
[    8s] UAV: [ 164.0,  124.0] | ISAC: WEAK   | Signal:  35.7% | TX: ✓

      -> Survivor detected: ID=SUR-20250115103045-1234, Confidence=89.2%
Data prepared for transmission: GOOD mode, 551.2 KB
Data prepared for transmission: MEDIUM mode, 150.8 KB
Data prepared for transmission: WEAK mode, 0.3 KB

Weather update: Rain started (5.2 mm/hr)
ISAC mode switched to: WEAK (Signal: 32.1%)

Simulation completed successfully!
```

## ⚙️ **Configuration**

Edit `config/simulationConfig.js` to customize simulation parameters:

```javascript
// Simulation timing
this.simulationTime = 300;      // 5 minutes
this.dt = 2;                    // 2-second time steps
this.realTime = true;           // Real-time execution

// Backend server
this.backendUrl = 'http://localhost:3000';

// UAV parameters
this.uavStartPosition = [100, 100, 50];  // [x, y, altitude] meters
this.uavVelocity = [8, 3, 0];            // [vx, vy, vz] m/s

// ISAC thresholds
this.isacThresholds = {
    goodMin: 75,        // Good mode threshold
    mediumMin: 40       // Medium mode threshold
};
```

## 🔧 **Key Features**

### **Identical MATLAB Functionality**
- ✅ Same RF propagation calculations
- ✅ Same ISAC mode switching logic
- ✅ Same survivor detection algorithms
- ✅ Same environmental modeling
- ✅ Same data transmission filtering

### **JavaScript Advantages**
- ✅ No MATLAB license required
- ✅ Runs anywhere Node.js runs
- ✅ Easy to integrate with web backends
- ✅ Better performance for real-time applications
- ✅ Simple deployment and hosting

### **ISAC Communication Modes**

1. **Good Mode** (Signal ≥ 75%)
   - Full HD video stream (1080p)
   - Complete survivor detection data
   - AI model updates (federated learning)
   - Environmental sensor data
   - Full UAV telemetry

2. **Medium Mode** (Signal 40-75%)
   - Compressed video stream (480p)
   - Essential survivor detections only
   - Critical telemetry data
   - No model updates

3. **Weak Mode** (Signal < 40%)
   - No video transmission
   - High-confidence survivor coordinates only
   - Minimal telemetry (position and battery)
   - Emergency data prioritization

## 🎮 **Usage Examples**

### **Basic Simulation**
```javascript
const { UAVSimulator } = require('./mainSimulation');

const simulator = new UAVSimulator();
simulator.start();

// Stop after 60 seconds
setTimeout(() => {
    simulator.stop();
}, 60000);
```

### **Custom Configuration**
```javascript
const simulator = new UAVSimulator();

// Modify configuration
simulator.config.simulationTime = 120;  // 2 minutes
simulator.config.realTime = false;      // Run as fast as possible
simulator.config.uavStartPosition = [0, 0, 30];  // Different start position

simulator.start();
```

### **Integration with Express.js Backend**
```javascript
const express = require('express');
const { UAVSimulator } = require('./mainSimulation');

const app = express();
const simulator = new UAVSimulator();

app.post('/api/simulation/start', (req, res) => {
    simulator.start();
    res.json({ status: 'started' });
});

app.get('/api/simulation/status', (req, res) => {
    res.json(simulator.getStatus());
});

app.listen(3000);
```

## 📡 **Backend Integration**

The simulation automatically attempts to send data to a backend server:

### **Expected Backend Endpoint**
```javascript
// POST /api/uav/data
{
  "timestamp": "2025-01-15T10:30:00Z",
  "uavId": "UAV-001",
  "location": {
    "lat": 12.9720,
    "lng": 77.5950,
    "altitude": 50
  },
  "isacMode": "good",
  "signalStrength": 85.2,
  "dataRate": 42.6,
  "detections": [
    {
      "id": "SUR-103045-1234",
      "coordinates": {"lat": 12.9725, "lng": 77.5955},
      "confidence": 0.89,
      "type": "human",
      "timestamp": "2025-01-15T10:30:00Z"
    }
  ],
  "videoStream": {
    "data": "base64_encoded_video_data",
    "quality": "1080p",
    "compression": "none"
  },
  "telemetry": {
    "batteryLevel": 78.5,
    "heading": 45.2,
    "speed": 8.5
  }
}
```

### **No Backend Required**
If no backend is available, the simulation:
- Continues running normally
- Logs data locally to console
- Shows all ISAC functionality
- Perfect for testing and development

## 🧪 **Testing Different Scenarios**

### **Test ISAC Mode Switching**
```javascript
// In config/simulationConfig.js
this.isacThresholds = {
    goodMin: 90,   // Very high threshold - forces medium/weak modes
    mediumMin: 70  // High threshold
};
```

### **Test High Detection Rate**
```javascript
// In config/simulationConfig.js
this.detection = {
    probability: 0.8,  // 80% chance of detection per step
    falsePositiveRate: 0.1
};
```

### **Test Fast Simulation**
```javascript
// In config/simulationConfig.js
this.realTime = false;        // Run as fast as possible
this.simulationTime = 60;     // 1 minute simulation
this.dt = 1;                  // 1-second time steps
```

## 🔄 **Comparison with MATLAB Version**

| Feature | MATLAB | JavaScript |
|---------|--------|------------|
| **RF Calculations** | ✅ Identical | ✅ Identical |
| **ISAC Logic** | ✅ Same algorithms | ✅ Same algorithms |
| **Data Generation** | ✅ Random seed based | ✅ Random seed based |
| **Performance** | ⚠️ Slower | ✅ Faster |
| **Dependencies** | ❌ MATLAB license | ✅ Node.js only |
| **Deployment** | ❌ Complex | ✅ Simple |
| **Integration** | ⚠️ HTTP only | ✅ Native JS |

## 🚀 **Deployment Options**

### **Local Development**
```bash
node mainSimulation.js
```

### **Production Server**
```bash
# Install PM2 for process management
npm install -g pm2

# Run simulation as background service
pm2 start mainSimulation.js --name "uav-simulation"

# Monitor
pm2 status
pm2 logs uav-simulation
```

### **Docker Container**
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "mainSimulation.js"]
```

### **Cloud Hosting**
- **Heroku**: `git push heroku main`
- **Railway**: Connect GitHub repo
- **DigitalOcean**: Deploy as Node.js app
- **AWS/GCP**: Container or serverless deployment

## 🐛 **Troubleshooting**

### **Common Issues**

1. **Node.js Version**
   ```bash
   node --version  # Should be 14+
   ```

2. **Permission Errors**
   ```bash
   sudo npm install -g nodemon  # If needed for development
   ```

3. **Port Already in Use**
   ```javascript
   // Change backend URL in config if needed
   this.backendUrl = 'http://localhost:3001';
   ```

### **Performance Tips**

- **Faster Execution**: Set `realTime: false`
- **Shorter Test**: Set `simulationTime: 30`
- **Less Frequent Updates**: Set `dt: 5`

## 📈 **Monitoring and Logging**

The simulation provides detailed logging:
- Real-time position and ISAC status
- Survivor detection events
- Weather condition changes
- Battery level warnings
- Data transmission statistics

## 🎯 **Next Steps**

1. **Run the simulation**: `node mainSimulation.js`
2. **Integrate with backend**: Connect to your Node.js/Express server
3. **Build frontend**: Use the data stream for React dashboard
4. **Deploy**: Host on your preferred cloud platform

The JavaScript version is production-ready and works exactly like the MATLAB simulation but with better performance and easier deployment! 🚁