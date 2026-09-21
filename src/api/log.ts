import type {LogListQuery, OperationLog, PageResult} from '@/types';
import {api} from './client';

export const logApi = {
    list: (query: LogListQuery) => api.get<PageResult<OperationLog>>('/admin/logs', query),

    removeMany: (ids: number[]) => api.post<{ deleted: number }>('/admin/logs/batch-delete', {ids}),

    clearByRange: (from?: string, to?: string) =>
        api.post<{ deleted: number }>('/admin/logs/clear', {from, to}),
};
