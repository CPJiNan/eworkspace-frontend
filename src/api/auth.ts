import type {AuthResult, User} from '@/types';
import {api} from './client';

export interface LoginPayload {
    studentId: string;
    password: string;
}

export interface ChangePasswordPayload {
    oldPassword: string;
    newPassword: string;
}

export const authApi = {
    login: (payload: LoginPayload) => api.post<AuthResult>('/auth/login', payload),

    logout: (refreshToken: string) => api.post<{ message: string }>('/auth/logout', {refreshToken}),

    me: () => api.get<User>('/auth/me'),

    changePassword: (payload: ChangePasswordPayload) =>
        api.post<{ message: string }>('/auth/password', payload),
};
