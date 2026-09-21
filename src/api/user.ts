import type {CreateAccountsResponse, MemberListQuery, PageResult, Role, User,} from '@/types';
import {api} from './client';

export interface UpdateProfilePayload {
    name?: string;
    phone?: string;
    wechat?: string;
    qq?: string;
    email?: string;
}

export interface CreateAccountsPayload {
    studentIds: string[];
    name?: string;
    phone?: string;
    wechat?: string;
    qq?: string;
    email?: string;
    role?: Role;
}

export const userApi = {
    me: () => api.get<User>('/users/me'),

    updateMe: (payload: UpdateProfilePayload) => api.patch<User>('/users/me', payload),

    listMembers: (query: MemberListQuery) => api.get<PageResult<User>>('/admin/members', query),

    getMember: (studentId: string) => api.get<User>(`/admin/members/${studentId}`),

    createAccounts: (payload: CreateAccountsPayload) =>
        api.post<CreateAccountsResponse>('/admin/members', payload),

    updateMember: (studentId: string, payload: UpdateProfilePayload) =>
        api.patch<User>(`/admin/members/${studentId}`, payload),

    setBanned: (studentId: string, banned: boolean) =>
        api.patch<{ studentId: string; banned: boolean }>(`/admin/members/${studentId}/ban`, {banned}),

    resetPassword: (studentId: string, newPassword?: string) =>
        api.post<{ studentId: string; initialPassword: string }>(
            `/admin/members/${studentId}/password/reset`,
            {newPassword: newPassword ?? ''},
        ),

    deleteAccount: (studentId: string) =>
        api.delete<{ studentId: string; deleted: boolean }>(`/admin/members/${studentId}`),
};
