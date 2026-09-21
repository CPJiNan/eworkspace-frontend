import type {
    CreateProjectPayload,
    Discussion,
    MyTask,
    MyTasksQuery,
    PageResult,
    Project,
    ProjectListQuery,
    ProjectStatus,
    UpdateProjectPayload,
} from '@/types';
import {api} from './client';

export interface AssignMembersResponse {
    members: { studentId: string; studentName: string; assigned: boolean; assignedBy?: string }[];
}

export const projectApi = {
    list: (query: ProjectListQuery) => api.get<PageResult<Project>>('/projects', query),

    detail: (id: number) => api.get<Project>(`/projects/${id}`),

    create: (payload: CreateProjectPayload) => api.post<Project>('/projects', payload),

    update: (id: number, payload: UpdateProjectPayload) =>
        api.patch<Project>(`/projects/${id}`, payload),

    setStatus: (id: number, status: ProjectStatus) =>
        api.patch<{ id: number; status: ProjectStatus }>(`/projects/${id}/status`, {status}),

    remove: (id: number, reason: string) =>
        api.delete<{ id: number; deleted: boolean }>(`/projects/${id}`, {confirm: true, reason}),

    addDiscussion: (projectId: number, content: string) =>
        api.post<Discussion>(`/projects/${projectId}/discussions`, {content}),

    updateDiscussion: (discussionId: number, content: string) =>
        api.patch<Discussion>(`/discussions/${discussionId}`, {content}),

    removeDiscussion: (discussionId: number) =>
        api.delete<{ id: number; deleted: boolean }>(`/discussions/${discussionId}`),

    myTasks: (query: MyTasksQuery) => api.get<PageResult<MyTask>>('/my/tasks', query),

    claim: (assignmentId: number) => api.post<unknown>(`/assignments/${assignmentId}/claim`),

    cancelClaim: (assignmentId: number) => api.delete<unknown>(`/assignments/${assignmentId}/claim`),

    assign: (assignmentId: number, studentIds: string[]) =>
        api.post<AssignMembersResponse>(`/assignments/${assignmentId}/assign`, {studentIds}),
};
