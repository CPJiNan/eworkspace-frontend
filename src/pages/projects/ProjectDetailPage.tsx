import {useCallback, useMemo, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {
    ArrowLeftOutlined,
    DeleteOutlined,
    EditOutlined,
    PlusOutlined,
    TeamOutlined,
    UserAddOutlined,
} from '@ant-design/icons';
import {
    Alert,
    Button,
    Card,
    Descriptions,
    Divider,
    Empty,
    Flex,
    Form,
    List,
    Modal,
    Popconfirm,
    Select,
    Space,
    Spin,
    Tag,
    Tooltip,
    Typography,
} from 'antd';

import {projectApi} from '@/api/project';
import {userApi} from '@/api/user';
import {ApiError} from '@/api/error';
import {AssignmentCapacity} from '@/components/common/AssignmentCapacity';
import {CountedTextArea} from '@/components/common/CountedTextArea';
import {ErrorBlock, LoadingBlock} from '@/components/common/StateBlocks';
import {ProjectStatusTag} from '@/components/common/ProjectStatusTag';
import {useAsync} from '@/hooks/useAsync';
import {useIsMobile} from '@/hooks/useIsMobile';
import {canManage, useAuthStore} from '@/stores/authStore';
import type {Assignment, Discussion, Project} from '@/types';
import {TEXT_LIMIT} from '@/utils/constants';
import {getStaticApi} from '@/utils/antdStatic';
import {formatDateTime, formatDeadline} from '@/utils/format';

export function ProjectDetailPage() {
    const {id} = useParams<{ id: string }>();
    const projectId = Number(id);
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const user = useAuthStore((state) => state.user);
    const isAdmin = canManage(user?.role);

    const project = useAsync(() => projectApi.detail(projectId), [projectId], {
        enabled: Number.isFinite(projectId) && projectId > 0,
    });

    const [actionId, setActionId] = useState<number | null>(null);
    const [assignTarget, setAssignTarget] = useState<Assignment | null>(null);
    const [discussionText, setDiscussionText] = useState('');
    const [discussionSubmitting, setDiscussionSubmitting] = useState(false);
    const [editingDiscussion, setEditingDiscussion] = useState<Discussion | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteForm] = Form.useForm<{ reason: string }>();

    const data = project.data;

    const isParticipant = Boolean(data?.mine);
    const canDiscuss = isAdmin || isParticipant;

    const handleClaim = useCallback(
        async (assignment: Assignment) => {
            setActionId(assignment.id);
            try {
                await projectApi.claim(assignment.id);
                getStaticApi()?.message.success(`已申领「${assignment.name}」`);
                project.reload();
            } catch (error) {
                const message = error instanceof ApiError ? error.message : '申领失败';
                getStaticApi()?.message.error(message);
            } finally {
                setActionId(null);
            }
        },
        [project],
    );

    const handleCancelClaim = useCallback(
        async (assignment: Assignment) => {
            setActionId(assignment.id);
            try {
                await projectApi.cancelClaim(assignment.id);
                getStaticApi()?.message.success(`已取消申领「${assignment.name}」`);
                project.reload();
            } catch (error) {
                const message = error instanceof ApiError ? error.message : '取消失败';
                getStaticApi()?.message.error(message);
            } finally {
                setActionId(null);
            }
        },
        [project],
    );

    const handleAddDiscussion = async () => {
        const content = discussionText.trim();
        if (!content) {
            getStaticApi()?.message.warning('请输入讨论内容');
            return;
        }
        setDiscussionSubmitting(true);
        try {
            await projectApi.addDiscussion(projectId, content);
            getStaticApi()?.message.success('讨论已发布');
            setDiscussionText('');
            project.reload();
        } catch (error) {
            const message = error instanceof ApiError ? error.message : '发布失败';
            getStaticApi()?.message.error(message);
        } finally {
            setDiscussionSubmitting(false);
        }
    };

    const handleUpdateDiscussion = async () => {
        if (!editingDiscussion) return;
        const content = editingDiscussion.content.trim();
        if (!content) {
            getStaticApi()?.message.warning('讨论内容不能为空');
            return;
        }
        setDiscussionSubmitting(true);
        try {
            await projectApi.updateDiscussion(editingDiscussion.id, content);
            getStaticApi()?.message.success('讨论已更新');
            setEditingDiscussion(null);
            project.reload();
        } catch (error) {
            const message = error instanceof ApiError ? error.message : '更新失败';
            getStaticApi()?.message.error(message);
        } finally {
            setDiscussionSubmitting(false);
        }
    };

    const handleDeleteDiscussion = async (discussion: Discussion) => {
        try {
            await projectApi.removeDiscussion(discussion.id);
            getStaticApi()?.message.success('讨论已删除');
            project.reload();
        } catch (error) {
            const message = error instanceof ApiError ? error.message : '删除失败';
            getStaticApi()?.message.error(message);
        }
    };

    const handleDeleteProject = async () => {
        const values = await deleteForm.validateFields();
        setDeleting(true);
        try {
            await projectApi.remove(projectId, values.reason.trim());
            getStaticApi()?.message.success('项目已删除');
            setDeleteOpen(false);
            navigate('/admin/projects', {replace: true});
        } catch (error) {
            const message = error instanceof ApiError ? error.message : '删除失败';
            getStaticApi()?.message.error(message);
        } finally {
            setDeleting(false);
        }
    };

    const deadline = useMemo(
        () => (data ? formatDeadline(data.deadline, data.status) : null),
        [data],
    );

    if (project.loading && !data) return <LoadingBlock rows={6}/>;
    if (project.error) {
        return (
            <Space direction="vertical" size={16} style={{width: '100%'}}>
                <Button icon={<ArrowLeftOutlined/>} onClick={() => {
                    navigate(-1);
                }}>
                    返回
                </Button>
                <ErrorBlock error={project.error} onRetry={project.reload}/>
            </Space>
        );
    }
    if (!data) return null;

    return (
        <Space direction="vertical" size={16} style={{width: '100%'}}>
            <Flex justify="space-between" align="center" wrap gap={8}>
                <Button icon={<ArrowLeftOutlined/>} onClick={() => {
                    navigate(-1);
                }}>
                    返回
                </Button>
                {isAdmin ? (
                    <Space wrap>
                        <Button icon={<EditOutlined/>} onClick={() => {
                            navigate(`/admin/projects/${projectId}/edit`);
                        }}>
                            编辑项目
                        </Button>
                        <Button danger icon={<DeleteOutlined/>} onClick={() => {
                            setDeleteOpen(true);
                        }}>
                            删除项目
                        </Button>
                    </Space>
                ) : null}
            </Flex>

            <Card>
                <Flex justify="space-between" align="flex-start" gap={12} wrap>
                    <Space direction="vertical" size={4}>
                        <Typography.Title level={isMobile ? 5 : 4} style={{margin: 0}}>
                            {data.name}
                        </Typography.Title>
                        <Space size={4} wrap>
                            <ProjectStatusTag status={data.status} label={data.statusName}/>
                            {data.semesters.map((semester) => (
                                <Tag key={semester.id} color="blue">
                                    {semester.name}
                                </Tag>
                            ))}
                            {data.tags.map((tag) => (
                                <Tag key={tag.id}>{tag.name}</Tag>
                            ))}
                            {data.mine ? <Tag color="green">已参与</Tag> : null}
                        </Space>
                    </Space>
                </Flex>

                <Divider style={{margin: '12px 0'}}/>

                {data.description ? (
                    <Typography.Paragraph
                        className="preserve-linebreak"
                        style={{marginBottom: 8}}
                    >
                        {data.description}
                    </Typography.Paragraph>
                ) : (
                    <Typography.Text type="secondary">暂无项目描述</Typography.Text>
                )}

                <Descriptions size="small" column={isMobile ? 1 : 3} colon={false}>
                    <Descriptions.Item label="截止时间">
                        <Typography.Text type={deadline?.overdue ? 'danger' : undefined}>
                            {deadline?.text}
                        </Typography.Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="发布者">{data.creatorName || data.creatorId}</Descriptions.Item>
                    <Descriptions.Item label="发布时间">{formatDateTime(data.createdAt)}</Descriptions.Item>
                    <Descriptions.Item label="申领情况">
                        {data.totalClaimed}/{data.totalCapacity}
                    </Descriptions.Item>
                    <Descriptions.Item label="讨论数量">{data.discussionCount}</Descriptions.Item>
                    <Descriptions.Item label="分工数量">{data.assignments.length}</Descriptions.Item>
                </Descriptions>
            </Card>

            <Card title="具体分工">
                {data.assignments.length === 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据"/>
                ) : (
                    <List
                        dataSource={data.assignments}
                        split
                        renderItem={(assignment) => (
                            <List.Item
                                key={assignment.id}
                                actions={renderAssignmentActions(assignment, {
                                    isAdmin,
                                    projectStatus: data.status,
                                    loading: actionId === assignment.id,
                                    onClaim: (item) => void handleClaim(item),
                                    onCancel: (item) => void handleCancelClaim(item),
                                    onAssign: setAssignTarget,
                                })}
                            >
                                <List.Item.Meta
                                    title={
                                        <Space size={6} wrap>
                                            <Typography.Text strong>{assignment.name}</Typography.Text>
                                            {assignment.mine ? <Tag color="green">我的分工</Tag> : null}
                                            <Typography.Text type="secondary" style={{fontSize: 12}}>
                                                工作量 {assignment.workload}
                                            </Typography.Text>
                                            {assignment.deadline ? (
                                                <Typography.Text type="secondary" style={{fontSize: 12}}>
                                                    截止 {formatDateTime(assignment.deadline)}
                                                </Typography.Text>
                                            ) : null}
                                        </Space>
                                    }
                                    description={
                                        <Space direction="vertical" size={4} style={{width: '100%'}}>
                                            {assignment.description ? (
                                                <Typography.Paragraph
                                                    className="preserve-linebreak"
                                                    style={{marginBottom: 0}}
                                                >
                                                    {assignment.description}
                                                </Typography.Paragraph>
                                            ) : null}
                                            <AssignmentCapacity assignment={assignment} showProgress/>
                                            {assignment.members && assignment.members.length > 0 ? (
                                                <Space size={4} wrap>
                                                    <TeamOutlined/>
                                                    {assignment.members.map((member) => (
                                                        <Tag key={member.studentId}
                                                             color={member.assigned ? 'blue' : 'default'}>
                                                            {member.studentName || member.studentId}
                                                            {member.assigned ? '（指派）' : ''}
                                                        </Tag>
                                                    ))}
                                                </Space>
                                            ) : null}
                                        </Space>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                )}
            </Card>

            <Card title={`项目讨论区（${data.discussionCount}）`}>
                {canDiscuss ? (
                    <CountedTextArea
                        limit={TEXT_LIMIT.long}
                        value={discussionText}
                        onChange={(event) => {
                            setDiscussionText(event.target.value);
                        }}
                        placeholder="补充说明、注意事项等"
                        autoSize={{minRows: 2, maxRows: 6}}
                        actions={
                            <Button
                                type="primary"
                                icon={<PlusOutlined/>}
                                size="small"
                                loading={discussionSubmitting}
                                onClick={handleAddDiscussion}
                            >
                                发表讨论
                            </Button>
                        }
                    />
                ) : (
                    <Alert
                        type="info"
                        showIcon
                        message="只有管理员与项目成员可以发表讨论"
                        style={{marginBottom: 12}}
                    />
                )}

                <Divider style={{margin: '12px 0'}}/>

                {!data.discussions || data.discussions.length === 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据"/>
                ) : (
                    <List
                        dataSource={data.discussions}
                        renderItem={(discussion) => (
                            <List.Item
                                key={discussion.id}
                                actions={
                                    discussion.editable
                                        ? [
                                            <Button
                                                key="edit"
                                                type="link"
                                                size="small"
                                                onClick={() => {
                                                    setEditingDiscussion({
                                                        ...discussion,
                                                        content: discussion.content,
                                                    });
                                                }
                                                }
                                            >
                                                编辑
                                            </Button>,
                                            <Popconfirm
                                                key="delete"
                                                title="确认删除这条讨论？"
                                                okText="删除"
                                                cancelText="取消"
                                                okButtonProps={{danger: true}}
                                                onConfirm={() => handleDeleteDiscussion(discussion)}
                                            >
                                                <Button type="link" size="small" danger>
                                                    删除
                                                </Button>
                                            </Popconfirm>,
                                        ]
                                        : undefined
                                }
                            >
                                <List.Item.Meta
                                    title={
                                        <Space size={8}>
                                            <Typography.Text
                                                strong>{discussion.authorName || discussion.authorId}</Typography.Text>
                                            <Typography.Text type="secondary" style={{fontSize: 12}}>
                                                {formatDateTime(discussion.createdAt)}
                                                {discussion.updatedAt !== discussion.createdAt ? '（已编辑）' : ''}
                                            </Typography.Text>
                                        </Space>
                                    }
                                    description={
                                        <Typography.Paragraph className="preserve-linebreak" style={{marginBottom: 0}}>
                                            {discussion.content}
                                        </Typography.Paragraph>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                )}
            </Card>

            <AssignMemberModal
                assignment={assignTarget}
                onClose={() => {
                    setAssignTarget(null);
                }}
                onSuccess={() => {
                    setAssignTarget(null);
                    project.reload();
                }}
            />

            <Modal
                open={Boolean(editingDiscussion)}
                title="编辑讨论"
                okText="保存"
                cancelText="取消"
                confirmLoading={discussionSubmitting}
                onOk={handleUpdateDiscussion}
                onCancel={() => {
                    setEditingDiscussion(null);
                }}
                destroyOnHidden
            >
                <CountedTextArea
                    limit={TEXT_LIMIT.long}
                    value={editingDiscussion?.content ?? ''}
                    onChange={(event) => {
                        setEditingDiscussion((prev) => (prev ? {...prev, content: event.target.value} : prev));
                    }
                    }
                    autoSize={{minRows: 3, maxRows: 8}}
                />
            </Modal>

            <Modal
                open={deleteOpen}
                title="删除项目"
                okText="确认删除"
                cancelText="取消"
                okButtonProps={{danger: true, loading: deleting}}
                onOk={handleDeleteProject}
                onCancel={() => {
                    setDeleteOpen(false);
                    deleteForm.resetFields();
                }}
                destroyOnHidden
            >
                <Alert
                    type="warning"
                    showIcon
                    message="删除后不可恢复"
                    style={{marginBottom: 12}}
                />
                <Form form={deleteForm} layout="vertical">
                    <Form.Item
                        name="reason"
                        label="删除原因"
                        rules={[
                            {required: true, message: '请填写删除原因'},
                            {max: TEXT_LIMIT.short, message: `不超过 ${TEXT_LIMIT.short} 字`},
                        ]}
                    >
                        <CountedTextArea
                            limit={TEXT_LIMIT.short}
                            autoSize={{minRows: 2, maxRows: 4}}
                            placeholder="删除原因"
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </Space>
    );
}

interface AssignmentActionOptions {
    isAdmin: boolean;
    projectStatus: Project['status'];
    loading: boolean;
    onClaim: (assignment: Assignment) => void;
    onCancel: (assignment: Assignment) => void;
    onAssign: (assignment: Assignment) => void;
}

function renderAssignmentActions(assignment: Assignment, options: AssignmentActionOptions) {
    const {isAdmin, projectStatus, loading, onClaim, onCancel, onAssign} = options;
    const actions: React.ReactNode[] = [];

    const projectClosed = projectStatus !== 'active';

    if (assignment.mine) {
        actions.push(
            <Popconfirm
                key="cancel"
                title="确认取消申领？"
                okText="确认取消"
                cancelText="再想想"
                onConfirm={() => {
                    onCancel(assignment);
                }}
            >
                <Button type="link" size="small" danger loading={loading}>
                    取消申领
                </Button>
            </Popconfirm>,
        );
    } else if (projectClosed) {
        actions.push(
            <Tooltip key="closed" title="项目已结束或已取消，无法申领">
                <Button type="link" size="small" disabled>
                    申领
                </Button>
            </Tooltip>,
        );
    } else if (assignment.full) {
        actions.push(
            <Tooltip key="full" title="名额已满，无法申领">
                <Button type="link" size="small" disabled>
                    申领
                </Button>
            </Tooltip>,
        );
    } else {
        actions.push(
            <Button key="claim" type="link" size="small" loading={loading} onClick={() => {
                onClaim(assignment);
            }}>
                申领
            </Button>,
        );
    }

    if (isAdmin && !projectClosed) {
        actions.push(
            <Button
                key="assign"
                type="link"
                size="small"
                icon={<UserAddOutlined/>}
                onClick={() => {
                    onAssign(assignment);
                }}
            >
                指派
            </Button>,
        );
    }

    return actions;
}

interface AssignMemberModalProps {
    assignment: Assignment | null;
    onClose: () => void;
    onSuccess: () => void;
}

function AssignMemberModal({assignment, onClose, onSuccess}: AssignMemberModalProps) {
    const [keyword, setKeyword] = useState('');
    const [selected, setSelected] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const members = useAsync(
        () => userApi.listMembers({keyword: keyword || undefined, page: 1, size: 50}),
        [keyword],
        {enabled: Boolean(assignment)},
    );

    const handleSubmit = async () => {
        if (!assignment) return;
        if (selected.length === 0) {
            getStaticApi()?.message.warning('请选择要指派的成员');
            return;
        }
        setSubmitting(true);
        try {
            await projectApi.assign(assignment.id, selected);
            getStaticApi()?.message.success(`已指派 ${selected.length} 位成员`);
            setSelected([]);
            onSuccess();
        } catch (error) {
            getStaticApi()?.message.error(error instanceof ApiError ? error.message : '指派失败');
        } finally {
            setSubmitting(false);
        }
    };

    const options: { label: React.ReactNode; value: string; disabled?: boolean }[] = [];
    for (const item of members.data?.items ?? []) {
        const already = (assignment?.members ?? []).some((m) => m.studentId === item.studentId);
        options.push({
            value: item.studentId,
            disabled: already,
            label: (
                <Space size={6}>
                    <span>{item.name || '未命名用户'}</span>
                    <Typography.Text type="secondary" style={{fontSize: 12}}>
                        {item.studentId}
                    </Typography.Text>
                    {item.banned ? <Tag color="red">已封禁</Tag> : null}
                    {already ? <Tag color="blue">已在该分工</Tag> : null}
                </Space>
            ),
        });
    }

    return (
        <Modal
            open={Boolean(assignment)}
            title="指派成员"
            okText="确认指派"
            cancelText="取消"
            confirmLoading={submitting}
            onOk={handleSubmit}
            onCancel={() => {
                setSelected([]);
                setKeyword('');
                onClose();
            }}
            destroyOnHidden
        >
            <Space direction="vertical" size={8} style={{width: '100%'}}>
                <Select
                    mode="multiple"
                    showSearch
                    allowClear
                    style={{width: '100%'}}
                    placeholder="按学号或姓名搜索成员"
                    value={selected}
                    onChange={setSelected}
                    onSearch={setKeyword}
                    filterOption={false}
                    notFoundContent={members.loading ? <Spin size="small"/> : '未找到成员'}
                    options={options}
                    maxTagCount="responsive"
                />
            </Space>
        </Modal>
    );
}
