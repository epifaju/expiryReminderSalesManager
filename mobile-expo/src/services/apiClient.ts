import axios from 'axios';
import CompressionService from './compression/CompressionService';
import { getApiUrls } from '../config/apiConfig';

const API_URLS = getApiUrls();
let currentApiUrl = API_URLS[0];
let isInitialized = false;

// Token provider function - will be set by authService
let getTokenCallback: (() => string | null) | null = null;
let getTenantCallback: (() => { organisationId: string | null; storeId: string | null }) | null = null;

// Function to set the token provider callback
const setTokenProvider = (callback: () => string | null) => {
  getTokenCallback = callback;
};

const setTenantProvider = (callback: () => { organisationId: string | null; storeId: string | null }) => {
  getTenantCallback = callback;
};

// Function to test API connectivity
const testApiConnection = async (url: string): Promise<boolean> => {
  try {
    console.log(`🔍 Testing connection to: ${url}`);
    // Use a simple GET request to a known public endpoint
    const response = await axios.get(`${url}/auth/signin`, { 
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
    console.log(`✅ Connection successful to: ${url}`);
    return true;
  } catch (error: any) {
    // If we get a 405 (Method Not Allowed) or 400 (Bad Request), the endpoint exists
    if (error.response && (error.response.status === 405 || error.response.status === 400)) {
      console.log(`✅ Connection successful to: ${url} (endpoint exists)`);
      return true;
    }
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
    const token = getTokenCallback ? getTokenCallback() : null;
    const quiet = Boolean(config.silentNotFound);

    if (!quiet) {
      console.log('🔑 Token disponible:', token ? 'OUI' : 'NON', token ? `(${token.substring(0, 20)}...)` : '');
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      if (!quiet) {
        console.log('📤 En-tête Authorization ajouté');
      }
    } else if (!quiet) {
      console.warn('⚠️ Pas de token d\'authentification disponible pour cette requête');
    }

    const tenant = getTenantCallback ? getTenantCallback() : null;
    if (tenant?.organisationId) {
      config.headers['X-Organisation-Id'] = tenant.organisationId;
    }
    if (tenant?.storeId) {
      config.headers['X-Store-Id'] = tenant.storeId;
    }
    
    if (!config.silentNotFound) {
      console.log('🔗 API Request:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    console.error('❌.Request interceptor error:', error);
    return Promise.reject(error);
  }
);

const isSilentNotFound = (config: { silentNotFound?: boolean; url?: string }, status?: number) =>
  status === 404 && Boolean(config.silentNotFound);

// Response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => {
    if (!isSilentNotFound(response.config, response.status)) {
      console.log('✅ API Response:', response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const config = error.config ?? {};

    if (isSilentNotFound(config, status)) {
      return Promise.reject(error);
    }

    console.error('❌ API Error:', error.message);

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
export { findWorkingApiUrl, updateApiClientBaseUrl, testApiConnection, initializeApiClient, setTokenProvider, setTenantProvider };
