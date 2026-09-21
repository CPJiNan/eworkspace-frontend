import {type OperationType, type ProjectStatus, Role, type TargetType} from '@/types';

export const PAGE_SIZE = 10;

export const TEXT_LIMIT = {
    short: 50,
    long: 1000,
} as const;

export const MAX_ASSIGNMENTS = 50;

export const MAX_CAPACITY = 100;

export const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; color: string }> = {
    active: {label: '进行中', color: 'processing'},
    finished: {label: '已结束', color: 'default'},
    cancelled: {label: '已取消', color: 'error'},
};

export const PROJECT_STATUS_OPTIONS = (Object.keys(PROJECT_STATUS_META) as ProjectStatus[]).map(
    (value) => ({value, label: PROJECT_STATUS_META[value].label}),
);

export const ROLE_META: Record<Role, { label: string; color: string }> = {
    [Role.SuperAdmin]: {label: '超级管理员', color: 'gold'},
    [Role.Admin]: {label: '管理员', color: 'blue'},
    [Role.User]: {label: '普通用户', color: 'default'},
};

export const ROLE_OPTIONS = [
    {value: Role.User, label: ROLE_META[Role.User].label},
    {value: Role.Admin, label: ROLE_META[Role.Admin].label},
];

export const OPERATION_LABEL: Record<OperationType, string> = {
    claim_assignment: '申领分工',
    cancel_assignment: '取消申领',
    create_project: '发布项目',
    update_project: '修改项目',
    delete_project: '删除项目',
    assign_assignment: '管理员指派',
    create_account: '新增账号',
    update_member: '修改成员信息',
    delete_member: '删除成员账号',
    reset_password: '重置密码',
    ban_account: '封禁账号',
    unban_account: '解封账号',
    create_admin: '创建管理员',
    delete_admin: '删除管理员',
    create_tag: '创建标签',
    rename_tag: '重命名标签',
    delete_tag: '删除标签',
    create_semester: '创建学期',
    rename_semester: '重命名学期',
    delete_semester: '删除学期',
    clear_operation_log: '清理操作日志',
};

export const OPERATION_OPTIONS = (Object.keys(OPERATION_LABEL) as OperationType[]).map((value) => ({
    value,
    label: OPERATION_LABEL[value],
}));

export const TARGET_TYPE_LABEL: Record<TargetType, string> = {
    user: '账号',
    project: '项目',
    assignment: '分工',
    discussion: '讨论区',
    tag: '标签',
    semester: '学期',
    notification: '站内短信',
    operation_log: '操作日志',
};

export const TARGET_TYPE_OPTIONS = (Object.keys(TARGET_TYPE_LABEL) as TargetType[]).map((value) => ({
    value,
    label: TARGET_TYPE_LABEL[value],
}));

