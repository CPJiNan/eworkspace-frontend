import axios, {type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig} from 'axios';

import type {ApiResponse, AuthResult} from '@/types';
import {authStorage} from './authStorage';
import {ApiError, ErrorCode} from './error';

export interface AuthBridge {
    getAccessToken(): string | null;

    getRefreshToken(): string | null;

    applyAuthResult(result: AuthResult): void;

    handleSessionExpired(): void;
}

let bridge: AuthBridge | null = null;

export function bindAuthBridge(impl: AuthBridge): void {
    bridge = impl;
}

export const API_BASE_URL = '/api';

export const http = axios.create({
    baseURL: API_BASE_URL,
    timeout: 20000,
    headers: {'Content-Type': 'application/json'},
});

function isPublicRequest(url?: string): boolean {
    if (!url) return false;
    return url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/health');
}

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = bridge?.getAccessToken() ?? authStorage.getAccessToken();
    if (token && !isPublicRequest(config.url)) {
        config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
});

let refreshPromise: Promise<AuthResult> | null = null;

async function requestRefresh(): Promise<AuthResult> {
    const refreshToken = bridge?.getRefreshToken() ?? authStorage.getRefreshToken();
    if (!refreshToken) {
        throw new ApiError(401, ErrorCode.Unauthorized, '登录状态已失效，请重新登录');
    }
    const response = await http.post<ApiResponse<AuthResult>>(
        '/auth/refresh',
        {refreshToken},
        {headers: {Authorization: ''}},
    );
    const result = response.data.data;
    bridge?.applyAuthResult(result);
    return result;
}

function startRefresh(): Promise<AuthResult> {
    if (!refreshPromise) {
        refreshPromise = requestRefresh().finally(() => {
            refreshPromise = null;
        });
    }
    return refreshPromise;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

http.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<{ code?: string; message?: string } | undefined>) => {
        if (!error.response) {
            const message =
                error.code === 'ECONNABORTED'
                    ? '请求超时，请检查网络后重试'
                    : '网络异常，无法连接服务器';
            return Promise.reject(new ApiError(0, 'NETWORK_ERROR', message));
        }

        const {status, data} = error.response;
        const config = error.config as RetriableConfig | undefined;
        const code = data?.code ?? 'UNKNOWN';
        const message = data?.message ?? '请求失败，请稍后重试';

        const isAuthEndpoint = isPublicRequest(config?.url);
        if (status === 401 && config && !config._retried && !isAuthEndpoint) {
            try {
                const result = await startRefresh();
                config._retried = true;
                config.headers.set('Authorization', `Bearer ${result.accessToken}`);
                return http.request(config);
            } catch {
                bridge?.handleSessionExpired();
                return Promise.reject(new ApiError(401, ErrorCode.TokenRevoked, '登录状态已失效，请重新登录'));
            }
        }

        if (status === 401 || code === ErrorCode.TokenRevoked || code === ErrorCode.AccountBanned) {
            if (!isAuthEndpoint) {
                bridge?.handleSessionExpired();
            }
        }

        return Promise.reject(new ApiError(status, code, message));
    },
);

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await http.request<ApiResponse<T>>(config);
    return response.data.data;
}

export const api = {
    get: <T>(url: string, params?: unknown) => request<T>({method: 'GET', url, params}),
    post: <T>(url: string, data?: unknown) => request<T>({method: 'POST', url, data}),
    patch: <T>(url: string, data?: unknown) => request<T>({method: 'PATCH', url, data}),
    delete: <T>(url: string, data?: unknown) => request<T>({method: 'DELETE', url, data}),
};
