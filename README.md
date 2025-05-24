# IoT Platform - Full Stack Application

This project implements a full-stack IoT (Internet of Things) platform consisting of a Node.js backend, a Vue.js frontend, and containerized using Docker.

## Project Overview

The platform allows for:
- **Device Registration:** New IoT devices can be registered with the backend.
- **Data Submission:** Registered devices can submit data (e.g., sensor readings) to the backend.
- **Data Visualization:** The frontend provides an admin interface to view registered devices and their submitted data.
- **Authentication:** Backend GET endpoints are protected and require a secret key for access.

## Architecture

The application is composed of three main parts:

1.  **`iot-backend`**:
    *   A Node.js application built with Express.js.
    *   Provides RESTful APIs for device management and data handling.
    *   Uses in-memory storage for devices and their data (for simplicity, not production-ready).
    *   Implements basic token-based authentication for secure GET endpoints.
    *   Containerized with Docker.

2.  **`iot-frontend`**:
    *   A Vue.js (v3) application built with TypeScript and Vite.
    *   Provides an admin interface to interact with the backend.
    *   Allows users to view registered devices and their data.
    *   Communicates with the backend via API calls, including the authentication token.
    *   Containerized with Docker and served by Nginx.

3.  **`docker-compose.yml`**:
    *   Orchestrates the `iot-backend` and `iot-frontend` services.
    *   Manages networking between the containers.
    *   Defines ports for accessing the services.

## Getting Started

### Prerequisites

*   Docker Engine and Docker Compose installed.
*   A modern web browser.

### Running the Application with Docker Compose

1.  **Clone the repository (if you haven't already):**
    ```bash
    # git clone <repository-url>
    # cd <repository-directory>
    ```

2.  **Build and run the services using Docker Compose:**
    From the project root directory (where `docker-compose.yml` is located):
    ```bash
    docker-compose up --build
    ```
    The `--build` flag ensures images are rebuilt if Dockerfiles have changed.

3.  **Accessing the services:**
    *   **Frontend Admin Interface:** Open your web browser and navigate to `http://localhost:8080`.
    *   **Backend API:** The backend API is accessible on `http://localhost:3000`. The frontend communicates with it via an Nginx proxy configured at `/api` on the frontend service.

### Default Ports

*   **Frontend (via Nginx):** `localhost:8080` (maps to port 80 inside the frontend container)
*   **Backend API:** `localhost:3000` (maps to port 3000 inside the backend container)

## Development

Refer to the README files within the `iot-backend` and `iot-frontend` directories for specific development and testing instructions for each part of the application.

*   `iot-backend/README.md`
*   `iot-frontend/README.md`

## Authentication

The backend API uses a simple secret key for authentication on `GET` requests to `/devices` and `/data/:deviceId`. The key is hardcoded as `YOUR_VERY_SECRET_KEY_123` in both the backend (`index.js`) and the frontend (`src/services/api.ts`). This is for demonstration purposes; in a real application, use a more secure authentication mechanism and manage secrets properly.

The frontend sends this key as a Bearer token in the `Authorization` header.

## Stopping the Application

To stop the services running via Docker Compose, press `Ctrl+C` in the terminal where `docker-compose up` is running.
To remove the containers, run:
```bash
docker-compose down
```

## Further Improvements (Beyond Scope of this Project)

*   **Database Integration:** Replace in-memory storage with a persistent database (e.g., PostgreSQL, MongoDB).
*   **Robust Authentication:** Implement OAuth2 or a similar robust authentication/authorization system.
*   **Real-time Data:** Use WebSockets for real-time data updates on the frontend.
*   **Scalability:** Design for horizontal scaling of backend services.
*   **Configuration Management:** Use environment variables for all configurations (ports, API keys, database URLs, etc.) rather than hardcoding.
*   **Comprehensive Error Handling and Logging.**
*   **More Sophisticated Frontend UI/UX.**
*   **Production-Ready Docker Setup:** Optimize Docker images for size and security, implement health checks, etc.
