# IoT Backend Service

This directory contains the Node.js Express backend service for the IoT Platform.

## Purpose

The backend service provides a RESTful API for:
- Registering new IoT devices.
- Accepting data submissions from registered devices.
- Retrieving lists of registered devices.
- Retrieving data for specific devices.
- Basic authentication for secure endpoints.

## API Endpoints

The base URL for the API when running locally is `http://localhost:3000`. When deployed via Docker Compose, the frontend Nginx service proxies requests from `/api` to this backend.

**Authentication:**
All `GET` endpoints (`/devices`, `/data/:deviceId`) require an `Authorization` header with a Bearer token.
The secret key is hardcoded as `YOUR_VERY_SECRET_KEY_123`.
Example Header: `Authorization: Bearer YOUR_VERY_SECRET_KEY_123`

---

### 1. Device Registration

*   **Endpoint:** `POST /devices`
*   **Description:** Registers a new IoT device.
*   **Request Body (JSON):**
    ```json
    {
      "deviceName": "Living Room Thermostat",
      "deviceType": "Thermostat"
    }
    ```
*   **Success Response (201 Created):**
    ```json
    {
      "status": "success",
      "deviceId": "device-1678886400000" 
    }
    ```
*   **Error Response (400 Bad Request - Missing fields):**
    ```json
    {
      "status": "error",
      "message": "Missing deviceName or deviceType"
    }
    ```

---

### 2. Get All Registered Devices

*   **Endpoint:** `GET /devices`
*   **Description:** Retrieves a list of all registered devices.
*   **Authentication:** Required.
*   **Success Response (200 OK):**
    ```json
    [
      {
        "id": "device-1678886400000",
        "name": "Living Room Thermostat",
        "type": "Thermostat",
        "registrationDate": "2023-03-15T12:00:00.000Z"
      },
      {
        "id": "device-1678886400001",
        "name": "Kitchen Smart Plug",
        "type": "SmartPlug",
        "registrationDate": "2023-03-15T12:00:01.000Z"
      }
    ]
    ```
*   **Error Response (401 Unauthorized - No token):**
    ```json
    { "message": "Unauthorized: No token provided" }
    ```
*   **Error Response (403 Forbidden - Invalid token):**
    ```json
    { "message": "Forbidden: Invalid token" }
    ```

---

### 3. Submit Device Data

*   **Endpoint:** `POST /data`
*   **Description:** Submits a data point from a registered device.
*   **Request Body (JSON):**
    ```json
    {
      "deviceId": "device-1678886400000",
      "timestamp": "2023-03-15T12:05:00.000Z",
      "payload": {
        "temperature": 22.5,
        "humidity": 45.6
      }
    }
    ```
*   **Success Response (201 Created):**
    ```json
    {
      "status": "success",
      "message": "Data received"
    }
    ```
*   **Error Response (400 Bad Request - Missing fields):**
    ```json
    {
      "status": "error",
      "message": "Missing deviceId, timestamp, or payload"
    }
    ```
*   **Error Response (404 Not Found - Device not registered):**
    ```json
    {
      "status": "error",
      "message": "Device not found"
    }
    ```

---

### 4. Get Data for a Specific Device

*   **Endpoint:** `GET /data/:deviceId`
*   **Description:** Retrieves all data points submitted by a specific device.
*   **Authentication:** Required.
*   **URL Parameters:**
    *   `deviceId` (string): The ID of the device.
*   **Success Response (200 OK):**
    ```json
    [
      {
        "timestamp": "2023-03-15T12:05:00.000Z",
        "payload": { "temperature": 22.5, "humidity": 45.6 },
        "receivedAt": "2023-03-15T12:05:01.123Z"
      },
      {
        "timestamp": "2023-03-15T12:10:00.000Z",
        "payload": { "temperature": 22.7, "humidity": 45.2 },
        "receivedAt": "2023-03-15T12:10:01.456Z"
      }
    ]
    ```
*   **Error Response (401 Unauthorized - No token):**
    ```json
    { "message": "Unauthorized: No token provided" }
    ```
*   **Error Response (403 Forbidden - Invalid token):**
    ```json
    { "message": "Forbidden: Invalid token" }
    ```
*   **Error Response (404 Not Found - Device not registered):**
    ```json
    {
      "status": "error",
      "message": "Device not found"
    }
    ```
    (Note: This will also be returned if the device is registered but has no data, an empty array `[]` is returned in that case if the device exists.)

## Local Development and Running

1.  **Navigate to this directory:**
    ```bash
    cd iot-backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the server:**
    ```bash
    npm start
    ```
    The server will start on `http://localhost:3000` by default.

## Testing

Tests are written using Jest and Supertest.

1.  **Install development dependencies (if not already installed):**
    ```bash
    npm install --save-dev jest supertest
    ```
2.  **Run tests:**
    ```bash
    npm test
    ```
    This will execute test files located in the `tests/` directory.
    The `NODE_ENV` is set to `test` by Jest, which prevents the application from actually starting its HTTP server on a port, allowing Supertest to manage it.
