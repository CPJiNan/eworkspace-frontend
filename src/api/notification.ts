import type {NotificationList} from '@/types';
import {api} from './client';

export const notificationApi = {
    list: (page = 1, size = 10) => api.get<NotificationList>('/notifications', {page, size}),

    markRead: (id: number) => api.patch<{ id: number; read: boolean }>(`/notifications/${id}/read`),

    markAllRead: () => api.patch<{ read: boolean }>('/notifications/read-all'),

    remove: (id: number) => api.delete<{ id: number; deleted: boolean }>(`/notifications/${id}`),

    removeMany: (ids: number[]) => api.post<{ deleted: number }>('/notifications/batch-delete', {ids}),

    clear: () => api.delete<{ deleted: number }>('/notifications'),
};
