import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Ensure we have the /api suffix for the API calls
const getApiUrl = (endpoint: string) => {
  const baseUrl = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;
  return endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : `${baseUrl}/${endpoint}`;
};

export interface LoginCredentials {
  login: string;
  password: string;
  role: 'admin' | 'operator';
}

export interface User {
  id: number;
  login: string;
  role: 'admin' | 'operator';
  name?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface ProfileResponse {
  success: boolean;
  data: User & {
    city?: string;
    status?: string;
    statusWork?: string;
    dateCreate?: string;
    note?: string;
    createdAt?: string;
  };
}

// Create axios instance
const api = axios.create({
  baseURL: getApiUrl(''),
  withCredentials: true, // Important for CORS with credentials
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(getApiUrl('/auth/refresh'), {
            refreshToken,
          });
          
          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          
          // Retry original request
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          return api.request(error.config);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      } else {
        // No refresh token, redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  getProfile: async (): Promise<ProfileResponse> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Storage helpers
  saveTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },

  saveUser: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('accessToken');
  },

  // Generic API methods for authenticated requests
  get: (url: string, config?: any) => api.get(url, config),
  post: (url: string, data?: any, config?: any) => api.post(url, data, config),
  put: (url: string, data?: any, config?: any) => api.put(url, data, config),
  delete: (url: string, config?: any) => api.delete(url, config),
};

// Export the axios instance for direct API calls
export default api;
