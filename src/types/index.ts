export enum Role {
    SuperAdmin = 0,
    Admin = 1,
    User = 2,
}

export type ProjectStatus = 'active' | 'finished' | 'cancelled';

export type TagType = 'semester' | 'project' | 'division';

export type NotificationType = 'project_published' | 'assigned' | 'deadline';

export type OperationType =
    | 'claim_assignment'
    | 'cancel_assignment'
    | 'create_project'
    | 'update_project'
    | 'delete_project'
    | 'assign_assignment'
    | 'create_account'
    | 'update_member'
    | 'delete_member'
    | 'reset_password'
    | 'ban_account'
    | 'unban_account'
    | 'create_admin'
    | 'delete_admin'
    | 'create_tag'
    | 'rename_tag'
    | 'delete_tag'
    | 'create_semester'
    | 'rename_semester'
    | 'delete_semester'
    | 'clear_operation_log';

export type TargetType =
    | 'user'
    | 'project'
    | 'assignment'
    | 'discussion'
    | 'tag'
    | 'semester'
    | 'notification'
    | 'operation_log';

export interface PageMeta {
    page: number;
    size: number;
    total: number;
    totalPages: number;
}

export interface PageResult<T> {
    items: T[];
    page: PageMeta;
}

export interface ApiResponse<T> {
    code: string;
    message: string;
    data: T;
}

export interface User {
    studentId: string;
    name: string;
    phone?: string;
    wechat?: string;
    qq?: string;
    email?: string;
    role: Role;
    roleName: string;
    mustChangePassword: boolean;
    banned: boolean;
    bannedAt?: string;
    createdAt: string;
    masked: boolean;
}

export interface AuthResult {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    user: User;
}

export interface Semester {
    id: number;
    name: string;
}

export interface Tag {
    id: number;
    name: string;
    type: TagType;
}

export interface Member {
    studentId: string;
    studentName: string;
    assigned: boolean;
    assignedBy?: string;
    createdAt: string;
}

export interface Assignment {
    id: number;
    name: string;
    description: string;
    tagId?: number;
    capacity: number;
    workload: number;
    claimedCount: number;
    remaining: number;
    full: boolean;
    deadline?: string;
    mine: boolean;
    members?: Member[];
}

export interface Discussion {
    id: number;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    editable: boolean;
}

export interface Project {
    id: number;
    name: string;
    description: string;
    deadline: string;
    status: ProjectStatus;
    statusName: string;
    creatorId: string;
    creatorName: string;
    createdAt: string;
    updatedAt: string;
    semesters: Semester[];
    tags: Tag[];
    assignments: Assignment[];
    discussions?: Discussion[];
    discussionCount: number;
    totalCapacity: number;
    totalClaimed: number;
    mine: boolean;
    myAssignmentIds: number[];
}

export interface MyTask {
    studentId: string;
    studentName: string;
    assigned: boolean;
    assignedBy?: string;
    claimedAt: string;
    assignmentId: number;
    assignmentName: string;
    projectId: number;
    projectName: string;
    projectStatus: ProjectStatus;
    deadline: string;
}

export interface Notification {
    id: number;
    title: string;
    content: string;
    read: boolean;
    type: NotificationType;
    projectId?: number;
    assignmentId?: number;
    createdAt: string;
}

export interface NotificationList {
    items: Notification[];
    page: PageMeta;
    unreadCount: number;
}

export interface OperationLog {
    id: number;
    operatorId: string;
    operatorName: string;
    type: OperationType;
    targetType: TargetType;
    targetId: string;
    targetName: string;
    detail: string;
    ip: string;
    userAgent: string;
    createdAt: string;
}

export interface CreateAccountResult {
    studentId: string;
    name: string;
    role: Role;
    roleName: string;
    email: string;
    initialPassword: string;
    created: boolean;
    error?: string;
}

export interface CreateAccountsResponse {
    results: CreateAccountResult[];
    success: number;
    failed: number;
}

export interface AssignmentPayload {
    id?: number;
    name: string;
    description: string;
    capacity: number;
    workload?: number;
    tagId?: number | null;
    deadline?: string | null;
}

export interface CreateProjectPayload {
    name: string;
    description: string;
    deadline: string;
    semesterIds: number[];
    tagIds: number[];
    assignments: AssignmentPayload[];
}

export interface UpdateProjectPayload {
    name?: string;
    description?: string;
    deadline?: string;
    status?: ProjectStatus;
    semesterIds?: number[];
    tagIds?: number[];
    assignments?: AssignmentPayload[];
}

export interface ProjectListQuery {
    keyword?: string;
    semesterId?: number;
    tagId?: number;
    status?: ProjectStatus;
    deadlineFrom?: string;
    deadlineTo?: string;
    includeAll?: boolean;
    page?: number;
    size?: number;
}

export interface MyTasksQuery {
    keyword?: string;
    page?: number;
    size?: number;
}

export interface MemberListQuery {
    keyword?: string;
    role?: Role;
    banned?: boolean;
    page?: number;
    size?: number;
}

export interface WorkloadItem {
    studentId: string;
    studentName: string;
    workload: number;
}

export interface WorkloadRanking {
    items: WorkloadItem[];
}

export interface LogListQuery {
    operatorId?: string;
    type?: OperationType;
    targetType?: TargetType;
    targetId?: string;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
}
