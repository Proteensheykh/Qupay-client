import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import type { ApiResponse, AuthTokenResponse } from '../types/auth';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://qupay-app-f70e5cb23170.herokuapp.com/api';

const LOG_STYLES = {
  request: '🔵',
  success: '🟢',
  error: '🔴',
};

function logRequest(config: InternalAxiosRequestConfig) {
  if (!__DEV__) return;
  
  const method = config.method?.toUpperCase() ?? 'UNKNOWN';
  const url = config.url ?? '';
  
  console.log(
    `${LOG_STYLES.request} [API Request] ${method} ${url}`,
    config.data ? { body: config.data } : ''
  );
}

function logResponse(response: AxiosResponse) {
  if (!__DEV__) return;
  
  const method = response.config.method?.toUpperCase() ?? 'UNKNOWN';
  const url = response.config.url ?? '';
  
  console.log(
    `${LOG_STYLES.success} [API Response] ${method} ${url}`,
    {
      status: response.status,
      data: response.data,
    }
  );
}

function logError(error: AxiosError<ApiResponse<unknown>>) {
  if (!__DEV__) return;
  
  const method = error.config?.method?.toUpperCase() ?? 'UNKNOWN';
  const url = error.config?.url ?? '';
  
  console.error(
    `${LOG_STYLES.error} [API Error] ${method} ${url}`,
    {
      status: error.response?.status ?? 'NO_RESPONSE',
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code,
    }
  );
}

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const refreshClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    logRequest(config);
    return config;
  },
  (error) => {
    if (__DEV__) console.error(`${LOG_STYLES.error} [API Request Error]`, error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    logResponse(response);
    const data = response.data as ApiResponse<unknown>;
    if (data && typeof data === 'object' && 'success' in data) {
      if (!data.success) {
        if (__DEV__) {
          console.error(`${LOG_STYLES.error} [API Business Error]`, {
            url: response.config.url,
            message: data.message,
          });
        }
        return Promise.reject(new ApiError(data.message || 'Request failed', response.status));
      }
      return { ...response, data: data.data };
    }
    return response;
  },
  async (error: AxiosError<ApiResponse<unknown>>) => {
    logError(error);
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const isAuthEndpoint = originalRequest?.url?.includes('/v1/auth/login') ||
      originalRequest?.url?.includes('/v1/auth/token/refresh') ||
      originalRequest?.url?.includes('/v1/auth/register');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { refreshToken, setTokens, logout } = useAuthStore.getState();

      if (!refreshToken) {
        if (__DEV__) console.log('🔴 [Auth] No refresh token available, logging out');
        isRefreshing = false;
        await logout();
        return Promise.reject(new ApiError('Session expired', 401));
      }

      try {
        if (__DEV__) console.log('🔄 [Auth] Attempting token refresh with token:', refreshToken?.substring(0, 20) + '...');
        const response = await refreshClient.post<ApiResponse<AuthTokenResponse>>(
          '/v1/auth/token/refresh',
          { refreshToken }
        );

        const data = response.data;
        if (!data.success || !data.data) {
          throw new Error('Refresh failed');
        }

        const tokens = data.data;
        if (__DEV__) console.log('🟢 [Auth] Token refresh successful');
        await setTokens(tokens);

        processQueue(null, tokens.accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        if (__DEV__) console.error('🔴 [Auth] Token refresh failed:', refreshError);
        processQueue(refreshError, null);
        await logout();
        return Promise.reject(new ApiError('Session expired', 401));
      } finally {
        isRefreshing = false;
      }
    }

    const message = error.response?.data?.message || error.message || 'Network error';
    return Promise.reject(new ApiError(message, error.response?.status || 0));
  }
);

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
