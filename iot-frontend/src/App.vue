<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getDevices, getDeviceData } from './services/api';

interface Device {
  id: string;
  name: string;
  type: string;
  registrationDate: string;
}

interface DeviceDataPoint {
  deviceId: string;
  timestamp: string;
  payload: Record<string, any>;
}

const devices = ref<Device[]>([]);
const selectedDevice = ref<Device | null>(null);
const selectedDeviceData = ref<DeviceDataPoint[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

onMounted(async () => {
  isLoading.value = true;
  error.value = null;
  try {
    devices.value = await getDevices();
  } catch (err) {
    console.error('Failed to fetch devices:', err);
    error.value = 'Failed to load devices.';
  } finally {
    isLoading.value = false;
  }
});

async function selectDevice(device: Device) {
  selectedDevice.value = device;
  selectedDeviceData.value = []; // Clear previous data
  isLoading.value = true;
  error.value = null;
  try {
    selectedDeviceData.value = await getDeviceData(device.id);
  } catch (err) {
    console.error(`Failed to fetch data for device ${device.id}:`, err);
    error.value = `Failed to load data for ${device.name}.`;
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div id="app">
    <header>
      <h1>IoT Platform Admin</h1>
    </header>
    <main>
      <div class="sidebar">
        <h2>Devices</h2>
        <div v-if="isLoading && devices.length === 0">Loading devices...</div>
        <div v-if="error && devices.length === 0">{{ error }}</div>
        <ul>
          <li v-for="device in devices" :key="device.id" @click="selectDevice(device)"
              :class="{ selected: selectedDevice?.id === device.id }">
            {{ device.name }} ({{ device.type }}) - ID: {{ device.id }}
          </li>
        </ul>
        <div v-if="!isLoading && devices.length === 0 && !error">No devices registered.</div>
      </div>

      <div class="content">
        <h2>Device Data</h2>
        <div v-if="!selectedDevice">Select a device to see its data.</div>
        <div v-if="isLoading && selectedDevice">Loading data for {{ selectedDevice.name }}...</div>
        <div v-if="error && selectedDevice">{{ error }}</div>
        <div v-if="selectedDevice && !isLoading && !error">
          <h3>Data for {{ selectedDevice.name }} (ID: {{ selectedDevice.id }})</h3>
          <ul v-if="selectedDeviceData.length > 0">
            <li v-for="(dataPoint, index) in selectedDeviceData" :key="index">
              <pre>{{ JSON.stringify(dataPoint, null, 2) }}</pre>
            </li>
          </ul>
          <div v-if="selectedDeviceData.length === 0 && !isLoading">No data available for this device.</div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: sans-serif;
}
header {
  background-color: #333;
  color: white;
  padding: 1rem;
  text-align: center;
}
main {
  display: flex;
  flex: 1;
  overflow: hidden; /* Prevent scrollbars on main if children manage their own */
}
.sidebar {
  width: 300px;
  background-color: #f4f4f4;
  padding: 1rem;
  overflow-y: auto; /* Allow scrolling for device list */
  border-right: 1px solid #ddd;
}
.sidebar h2 {
  margin-top: 0;
}
.sidebar ul {
  list-style: none;
  padding: 0;
}
.sidebar li {
  padding: 0.5rem;
  cursor: pointer;
  border-bottom: 1px solid #eee;
}
.sidebar li:hover {
  background-color: #e9e9e9;
}
.sidebar li.selected {
  background-color: #007bff;
  color: white;
}
.content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto; /* Allow scrolling for data content */
}
.content h2, .content h3 {
  margin-top: 0;
}
pre {
  background-color: #eee;
  padding: 0.5rem;
  border-radius: 4px;
  white-space: pre-wrap; /* Allow text wrapping in pre */
  word-break: break-all; /* Break long strings */
}
</style>
