// import { GoogleGenAI, GenerateContentResponse } from "@google/genai"; // Removed
import { marked } from 'marked';

// let ai: GoogleGenAI | null = null; // Removed
let systemInstruction: string = "";

// Placeholder for DOM elements
const chatHistory = document.getElementById('chat-history');
const messageInput = document.getElementById('message-input') as HTMLInputElement;
const sendButton = document.getElementById('send-button');
const infoMessage = document.getElementById('info-message');

async function initializeSystemInstruction(): Promise<void> {
  try {
    const response = await fetch('system-instruction.md');
    if (!response.ok) {
      throw new Error(`Failed to load system instruction: ${response.statusText}`);
    }
    systemInstruction = await response.text();
    console.log("System instruction loaded successfully.");
  } catch (error) {
    console.error("Error initializing system instruction:", error);
    displayErrorMessage("Failed to initialize system instructions. Please try refreshing.");
    systemInstruction = "You are a helpful assistant."; // Default instruction
  }
}

function displayMessage(message: string, sender: 'user' | 'ai') {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', `${sender}-message`);
  messageElement.innerHTML = sender === 'ai' ? marked(message) as string : message;
  if (chatHistory) chatHistory.appendChild(messageElement);
  if (chatHistory) chatHistory.scrollTop = chatHistory.scrollHeight;
}

function displayInfoMessage(message: string) {
  if (infoMessage) infoMessage.textContent = message;
}

function displayErrorMessage(message: string) {
  const errorElement = document.createElement('div');
  errorElement.classList.add('message', 'error-message');
  errorElement.textContent = message;
  if (chatHistory) chatHistory.appendChild(errorElement);
  if (chatHistory) chatHistory.scrollTop = chatHistory.scrollHeight;
}

async function handleSendMessage() {
  const userQuery = messageInput.value.trim();
  if (!userQuery) return;

  displayMessage(userQuery, 'user');
  messageInput.value = '';

  // Removed if (!ai) check

  try {
    const proxyResponse = await fetch('/api/ai-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: userQuery,
        systemInstruction: systemInstruction,
      }),
    });

    if (!proxyResponse.ok) {
      const errorData = await proxyResponse.json().catch(() => ({ error: "Unknown error occurred with the AI proxy." }));
      throw new Error(errorData.error || `Error from AI proxy: ${proxyResponse.statusText}`);
    }

    const responseData = await proxyResponse.json();

    if (responseData.text) {
      displayMessage(responseData.text, 'ai');
    } else if (responseData.error) {
      throw new Error(`Proxy Error: ${responseData.error}`);
    } else {
      throw new Error("Invalid response structure from AI proxy.");
    }

  } catch (error) {
    console.error("Error sending message via proxy:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred while communicating with the backend.";
    displayErrorMessage(errorMessage);
  }
}

async function initializeApp() {
  displayInfoMessage("Initializing system..."); // Updated message
  // Removed try...catch block for AI initialization
  await initializeSystemInstruction();
  // Removed ai = new GoogleGenAI(...)
  // Removed API_KEY check
  displayInfoMessage("AI Assistant ready."); // Updated message
  setupEventListeners();
}

function setupEventListeners() {
  if (sendButton && messageInput) {
    sendButton.addEventListener('click', handleSendMessage);
    messageInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        handleSendMessage();
      }
    });
  } else {
    console.error("Could not find send button or message input elements.");
  }
}

// Initialize the application when the script loads
initializeApp();
