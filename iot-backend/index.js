const express = require('express');
const cors = require('cors'); // Import cors package
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all routes.
// For production, restrict this to specific origins:
// const corsOptions = {
//   origin: 'http://localhost:5173', // Or your frontend's address
//   optionsSuccessStatus: 200
// };
// app.use(cors(corsOptions));
app.use(cors()); 

app.use(express.json());

const API_SECRET_KEY = 'YOUR_VERY_SECRET_KEY_123';

// Authentication middleware
function authenticateRequest(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1]; // Expecting "Bearer TOKEN_STRING"
    if (token === API_SECRET_KEY) {
      next(); // Proceed to the next middleware or route handler
    } else {
      res.status(403).json({ message: 'Forbidden: Invalid token' });
    }
  } else {
    res.status(401).json({ message: 'Unauthorized: No token provided' });
  }
}

let devices = [];
let deviceData = {};

app.get('/', (req, res) => {
  res.send('Hello, IoT Platform Backend!');
});

// Device registration endpoint
app.post('/devices', (req, res) => {
  const { deviceName, deviceType } = req.body;
  if (!deviceName || !deviceType) {
    console.error('Device registration failed: Missing deviceName or deviceType');
    return res.status(400).json({ status: 'error', message: 'Missing deviceName or deviceType' });
  }

  const deviceId = `device-${Date.now().toString()}`;
  const newDevice = {
    id: deviceId,
    name: deviceName,
    type: deviceType,
    registrationDate: new Date(),
  };
  devices.push(newDevice);
  console.log(`Device registered: ${deviceName} (ID: ${deviceId})`);
  res.status(201).json({ status: 'success', deviceId: deviceId });
});

// Get all devices endpoint
app.get('/devices', authenticateRequest, (req, res) => {
  res.json(devices);
});

// Data submission endpoint
app.post('/data', (req, res) => {
  const { deviceId, timestamp, payload } = req.body;
  if (!deviceId || !timestamp || !payload) {
    console.error('Data submission failed: Missing deviceId, timestamp, or payload');
    return res.status(400).json({ status: 'error', message: 'Missing deviceId, timestamp, or payload' });
  }

  const device = devices.find(d => d.id === deviceId);
  if (!device) {
    console.error(`Data submission failed: Device not found (ID: ${deviceId})`);
    return res.status(404).json({ status: 'error', message: 'Device not found' });
  }

  deviceData[deviceId] = deviceData[deviceId] || [];
  const dataPoint = { timestamp, payload, receivedAt: new Date() };
  deviceData[deviceId].push(dataPoint);
  console.log(`Data received from device: ${device.name} (ID: ${deviceId})`);
  res.status(201).json({ status: 'success', message: 'Data received' });
});

// Get data for a specific device endpoint
app.get('/data/:deviceId', authenticateRequest, (req, res) => {
  const { deviceId } = req.params;
  const device = devices.find(d => d.id === deviceId);

  if (!device) {
    console.error(`Failed to get data: Device not found (ID: ${deviceId})`);
    return res.status(404).json({ status: 'error', message: 'Device not found' });
  }

  const data = deviceData[deviceId] || [];
  res.json(data);
});

// const port = process.env.PORT || 3000; // Already defined above
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
  });
}

module.exports = app; // Export app for testing
