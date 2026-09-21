import type {Semester, Tag, TagType} from '@/types';
import {api} from './client';

interface ItemsResponse<T> {
    items: T[];
}

export const tagApi = {
    listSemesters: () => api.get<ItemsResponse<Semester>>('/semesters'),

    createSemester: (name: string) => api.post<Semester>('/semesters', {name}),

    renameSemester: (id: number, name: string) => api.patch<Semester>(`/semesters/${id}`, {name}),

    removeSemester: (id: number) => api.delete<{ id: number; deleted: boolean }>(`/semesters/${id}`),

    list: (type?: TagType) => api.get<ItemsResponse<Tag>>('/tags', type ? {type} : undefined),

    create: (name: string, type: TagType) => api.post<Tag>('/tags', {name, type}),

    rename: (id: number, name: string) => api.patch<Tag>(`/tags/${id}`, {name}),

    remove: (id: number) => api.delete<{ id: number; deleted: boolean }>(`/tags/${id}`),
};
