import axios from 'axios';
import { Platform } from 'react-native';
import authService from './authService';

// Dynamic API URL based on platform with fallback options
const getApiUrls = () => {
  if (Platform.OS === 'web') {
    return ['http://localhost:8080'];
  } else {
    // For Android emulator, try multiple options in order of preference
    // Backend Spring Boot runs on port 8080
    return [
      'http://192.168.1.27:8080',  // Your actual IP address
      'http://10.0.2.2:8080',      // Standard Android emulator localhost
      'http://localhost:8080',     // Sometimes works on some emulators
      'http://127.0.0.1:8080'      // Local loopback
    ];
  }
};

const API_URLS = getApiUrls();
let currentApiUrl = API_URLS[0];
let isInitialized = false;

// Function to test API connectivity
const testApiConnection = async (url: string): Promise<boolean> => {
  try {
    console.log(`🔍 Testing connection to: ${url}`);
    const response = await axios.get(`${url}/auth/test`, { 
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
    console.log(`✅ Connection successful to: ${url}`);
    return true;
  } catch (error) {
    console.log(`❌ Connection failed to: ${url}`);
    return false;
  }
};

// Function to find working API URL
const findWorkingApiUrl = async (): Promise<string> => {
  console.log('🔄 Searching for working API URL...');
  
  for (const url of API_URLS) {
    const isWorking = await testApiConnection(url);
    if (isWorking) {
      console.log(`🎯 Found working API URL: ${url}`);
      currentApiUrl = url;
      return url;
    }
  }
  
  console.error('❌ No working API URL found');
  throw new Error(`No API server found. Tried: ${API_URLS.join(', ')}`);
};

const apiClient = axios.create({
  baseURL: currentApiUrl,
  timeout: 15000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Function to update API client base URL
const updateApiClientBaseUrl = (newUrl: string) => {
  apiClient.defaults.baseURL = newUrl;
  currentApiUrl = newUrl;
  console.log(`🔄 Updated API client base URL to: ${newUrl}`);
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('🔗 API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for better error handling with URL fallback
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.error('❌ API Error:', error.message);
    
    // If network error, try to find a working URL
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      console.log('🔄 Network error detected, trying to find working URL...');
      
      try {
        const workingUrl = await findWorkingApiUrl();
        updateApiClientBaseUrl(workingUrl);
        
        // Retry the original request with the new URL
        const originalRequest = error.config;
        originalRequest.baseURL = workingUrl;
        console.log('🔄 Retrying request with new URL:', workingUrl);
        
        return apiClient(originalRequest);
      } catch (urlError) {
        console.error('❌ No working URL found for retry');
      }
    }
    
    if (error.response) {
      console.error('📄 Error response:', error.response.status, error.response.data);
    }
    return Promise.reject(error);
  }
);

// Function to initialize API client with working URL
const initializeApiClient = async (): Promise<void> => {
  if (isInitialized) return;
  
  console.log('🚀 Initializing API client...');
  try {
    const workingUrl = await findWorkingApiUrl();
    updateApiClientBaseUrl(workingUrl);
    isInitialized = true;
    console.log('✅ API client initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize API client:', error);
    // Keep the default URL as fallback
  }
};

export default apiClient;
export { findWorkingApiUrl, updateApiClientBaseUrl, testApiConnection, initializeApiClient };
