import axios from 'axios';

const API_SECRET_KEY = 'YOUR_VERY_SECRET_KEY_123'; // Must match backend

const apiClient = axios.create({
  baseURL: '/api', // Nginx will proxy this to the backend
  headers: {
    // 'Content-Type': 'application/json', // Not strictly needed here as GET requests don't have JSON body
                                         // and POST/PUT with JSON body will have it set by axios if data is an object.
    'Authorization': `Bearer ${API_SECRET_KEY}`,
  },
});

export async function getDevices(): Promise<any[]> {
  try {
    const response = await apiClient.get('/devices');
    return response.data;
  } catch (error) {
    console.error('Error fetching devices:', error);
    // Optionally, rethrow the error or return a specific error structure
    throw error; 
  }
}

export async function getDeviceData(deviceId: string): Promise<any[]> {
  try {
    const response = await apiClient.get(`/data/${deviceId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching data for device ${deviceId}:`, error);
    // Optionally, rethrow the error or return a specific error structure
    throw error;
  }
}
