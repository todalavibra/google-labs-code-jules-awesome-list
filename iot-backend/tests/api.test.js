const request = require('supertest');
const app = require('../index'); // Assuming app is exported from index.js

const API_SECRET_KEY = 'YOUR_VERY_SECRET_KEY_123'; // Must match the one in index.js

describe('IoT Platform Backend API', () => {
  let registeredDeviceId = null;

  // Test Device Registration
  describe('POST /devices', () => {
    it('should register a new device successfully', async () => {
      const response = await request(app)
        .post('/devices')
        .send({ deviceName: 'Test Sensor', deviceType: 'Temperature' });
      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('deviceId');
      registeredDeviceId = response.body.deviceId; // Save for later tests
      console.log(`Registered device ID for testing: ${registeredDeviceId}`);
    });

    it('should return 400 if deviceName or deviceType is missing', async () => {
      const response = await request(app)
        .post('/devices')
        .send({ deviceName: 'Test Sensor' }); // Missing deviceType
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
    });
  });

  // Test Data Submission
  describe('POST /data', () => {
    it('should submit data for a registered device successfully', async () => {
      expect(registeredDeviceId).not.toBeNull(); // Ensure device was registered
      const response = await request(app)
        .post('/data')
        .send({
          deviceId: registeredDeviceId,
          timestamp: new Date().toISOString(),
          payload: { temperature: 25.5, humidity: 60 },
        });
      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('status', 'success');
    });

    it('should return 404 if device ID is not registered', async () => {
      const response = await request(app)
        .post('/data')
        .send({
          deviceId: 'nonexistent-device-123',
          timestamp: new Date().toISOString(),
          payload: { temperature: 30 },
        });
      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('status', 'error');
    });

     it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/data')
        .send({
          deviceId: registeredDeviceId,
          // Missing timestamp and payload
        });
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
    });
  });

  // Test Protected Endpoints (Authentication)
  describe('Protected Endpoints', () => {
    // Tests for GET /devices
    describe('GET /devices', () => {
      it('should return 401 if no token is provided', async () => {
        const response = await request(app).get('/devices');
        expect(response.statusCode).toBe(401);
      });

      it('should return 403 if an invalid token is provided', async () => {
        const response = await request(app)
          .get('/devices')
          .set('Authorization', 'Bearer INVALID_TOKEN');
        expect(response.statusCode).toBe(403);
      });

      it('should return a list of devices if a valid token is provided', async () => {
        const response = await request(app)
          .get('/devices')
          .set('Authorization', `Bearer ${API_SECRET_KEY}`);
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        // Check if the previously registered device is in the list
        const deviceExists = response.body.some(device => device.id === registeredDeviceId);
        expect(deviceExists).toBe(true);
      });
    });

    // Tests for GET /data/:deviceId
    describe('GET /data/:deviceId', () => {
      it('should return 401 if no token is provided', async () => {
        const response = await request(app).get(`/data/${registeredDeviceId}`);
        expect(response.statusCode).toBe(401);
      });

      it('should return 403 if an invalid token is provided', async () => {
        const response = await request(app)
          .get(`/data/${registeredDeviceId}`)
          .set('Authorization', 'Bearer INVALID_TOKEN');
        expect(response.statusCode).toBe(403);
      });

      it('should return data for a device if a valid token is provided', async () => {
        const response = await request(app)
          .get(`/data/${registeredDeviceId}`)
          .set('Authorization', `Bearer ${API_SECRET_KEY}`);
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        // We expect at least one data point from the previous test
        expect(response.body.length).toBeGreaterThanOrEqual(1);
        if (response.body.length > 0) {
            expect(response.body[0].payload).toHaveProperty('temperature', 25.5);
        }
      });

      it('should return 404 if device ID does not exist (with valid token)', async () => {
        const response = await request(app)
          .get('/data/nonexistent-device-for-get')
          .set('Authorization', `Bearer ${API_SECRET_KEY}`);
        expect(response.statusCode).toBe(404);
      });
    });
  });
});
