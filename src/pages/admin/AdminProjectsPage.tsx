import {useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {PlusOutlined, ReloadOutlined, SearchOutlined} from '@ant-design/icons';
import {Button, Card, Dropdown, Flex, Form, Input, Modal, Select, Space, Table, Tag, Typography,} from 'antd';
import type {ColumnsType} from 'antd/es/table';

import {projectApi} from '@/api/project';
import {ApiError} from '@/api/error';
import {PagePager} from '@/components/common/PagePager';
import {CountedTextArea} from '@/components/common/CountedTextArea';
import {ProjectStatusTag} from '@/components/common/ProjectStatusTag';
import {useAsync} from '@/hooks/useAsync';
import {useIsMobile} from '@/hooks/useIsMobile';
import type {Project, ProjectStatus} from '@/types';
import {PAGE_SIZE, PROJECT_STATUS_OPTIONS, TEXT_LIMIT} from '@/utils/constants';
import {getStaticApi} from '@/utils/antdStatic';
import {formatDateTime} from '@/utils/format';
import {TagManagerCard} from './TagManagerCard';

type StatusScope = ProjectStatus | 'all';

const SCOPE_OPTIONS: { value: StatusScope; label: string }[] = [
    {value: 'all', label: '全部'},
    ...PROJECT_STATUS_OPTIONS,
];

export function AdminProjectsPage() {
    const navigate = useNavigate();
    const isMobile = useIsMobile();

    const [page, setPage] = useState(1);
    const [keyword, setKeyword] = useState('');
    const [searchKey, setSearchKey] = useState('');
    const [scope, setScope] = useState<StatusScope>('all');

    const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteForm] = Form.useForm<{ reason: string }>();

    const query = useMemo(
        () => ({
            keyword: searchKey || undefined,
            status: scope === 'all' ? undefined : (scope as ProjectStatus),
            includeAll: scope === 'all',
            page,
            size: PAGE_SIZE,
        }),
        [searchKey, scope, page],
    );

    const projects = useAsync(() => projectApi.list(query), [query]);
    const items = projects.data?.items ?? [];
    const meta = projects.data?.page;

    const handleSetStatus = async (project: Project, status: ProjectStatus) => {
        try {
            await projectApi.setStatus(project.id, status);
            getStaticApi()?.message.success(`「${project.name}」已切换为${statusLabel(status)}`);
            projects.reload();
        } catch (error) {
            getStaticApi()?.message.error(error instanceof ApiError ? error.message : '操作失败');
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        const values = await deleteForm.validateFields();
        setDeleting(true);
        try {
            await projectApi.remove(deleteTarget.id, values.reason.trim());
            getStaticApi()?.message.success('项目已删除');
            setDeleteTarget(null);
            deleteForm.resetFields();
            projects.reload();
        } catch (error) {
            getStaticApi()?.message.error(error instanceof ApiError ? error.message : '删除失败');
        } finally {
            setDeleting(false);
        }
    };

    const columns: ColumnsType<Project> = [
        {
            title: '项目',
            dataIndex: 'name',
            key: 'name',
            render: (_, record) => (
                <Space direction="vertical" size={2}>
                    <Typography.Link onClick={() => {
                        navigate(`/projects/${record.id}`);
                    }}>
                        {record.name}
                    </Typography.Link>
                    <Space size={4} wrap>
                        {record.semesters.map((semester) => (
                            <Tag key={semester.id} color="blue">
                                {semester.name}
                            </Tag>
                        ))}
                        {record.tags.map((tag) => (
                            <Tag key={tag.id}>{tag.name}</Tag>
                        ))}
                    </Space>
                </Space>
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (_, record) => <ProjectStatusTag status={record.status} label={record.statusName}/>,
        },
        {
            title: '分工',
            key: 'assignments',
            width: 200,
            render: (_, record) => (
                <Space direction="vertical" size={2} style={{width: '100%'}}>
                    {record.assignments.map((assignment) => (
                        <Flex key={assignment.id} justify="space-between" gap={8}>
                            <Typography.Text style={{fontSize: 12}} ellipsis>
                                {assignment.name}
                            </Typography.Text>
                            <Tag color={assignment.full ? 'red' : 'green'} style={{marginInlineEnd: 0}}>
                                {assignment.claimedCount}/{assignment.capacity}
                            </Tag>
                        </Flex>
                    ))}
                </Space>
            ),
        },
        {
            title: '截止时间',
            dataIndex: 'deadline',
            key: 'deadline',
            width: 150,
            render: (value: string) => formatDateTime(value),
        },
        {
            title: '发布者',
            dataIndex: 'creatorName',
            key: 'creator',
            width: 110,
            render: (value: string, record) => value || record.creatorId,
        },
        {
            title: '操作',
            key: 'action',
            width: 220,
            fixed: isMobile ? undefined : 'right',
            render: (_, record) => (
                <Space size={4} wrap>
                    <Button type="link" size="small" onClick={() => {
                        navigate(`/admin/projects/${record.id}/edit`);
                    }}>
                        编辑
                    </Button>
                    <Dropdown
                        menu={{
                            items: [
                                {
                                    key: 'active',
                                    label: '切换为进行中',
                                    disabled: record.status === 'active',
                                    onClick: () => handleSetStatus(record, 'active'),
                                },
                                {
                                    key: 'finished',
                                    label: '切换为已结束',
                                    disabled: record.status === 'finished',
                                    onClick: () => handleSetStatus(record, 'finished'),
                                },
                                {
                                    key: 'cancelled',
                                    label: '切换为已取消',
                                    disabled: record.status === 'cancelled',
                                    onClick: () => handleSetStatus(record, 'cancelled'),
                                },
                            ],
                        }}
                    >
                        <Button type="link" size="small">
                            状态
                        </Button>
                    </Dropdown>
                    <Button type="link" size="small" danger onClick={() => {
                        setDeleteTarget(record);
                    }}>
                        删除
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <Space direction="vertical" size={16} style={{width: '100%'}}>
            <div className="ews-toolbar">
                <Flex gap={8} wrap align="center">
                    <Input
                        allowClear
                        value={keyword}
                        onChange={(event) => {
                            setKeyword(event.target.value);
                        }}
                        onPressEnter={() => {
                            setSearchKey(keyword.trim());
                            setPage(1);
                        }}
                        prefix={<SearchOutlined/>}
                        placeholder="搜索项目名称、描述、分工、标签"
                        style={{flex: 1, minWidth: 200}}
                    />
                    <Select<StatusScope>
                        value={scope}
                        style={{width: 130}}
                        onChange={(value) => {
                            setScope(value);
                            setPage(1);
                        }}
                        options={SCOPE_OPTIONS}
                    />
                    <Button
                        type="primary"
                        onClick={() => {
                            setSearchKey(keyword.trim());
                            setPage(1);
                        }}
                    >
                        搜索
                    </Button>
                    <Button icon={<ReloadOutlined/>} onClick={projects.reload} loading={projects.loading}>
                        刷新
                    </Button>
                    <Button type="primary" icon={<PlusOutlined/>} onClick={() => {
                        navigate('/admin/projects/new');
                    }}>
                        发布项目
                    </Button>
                </Flex>
            </div>

            <Card styles={{body: {padding: isMobile ? 0 : 8}}}>
                <Table<Project>
                    rowKey="id"
                    size={isMobile ? 'small' : 'middle'}
                    columns={columns}
                    dataSource={items}
                    loading={projects.loading}
                    pagination={false}
                    scroll={{x: 900}}
                />
                {meta ? <PagePager page={meta} simple={isMobile} onChange={setPage}/> : null}
            </Card>

            <TagManagerCard/>

            <Modal
                open={Boolean(deleteTarget)}
                title={`删除项目：${deleteTarget?.name ?? ''}`}
                okText="确认删除"
                cancelText="取消"
                okButtonProps={{danger: true, loading: deleting}}
                onOk={handleDelete}
                onCancel={() => {
                    setDeleteTarget(null);
                    deleteForm.resetFields();
                }}
                destroyOnHidden
            >
                <Typography.Paragraph type="warning" style={{marginTop: 0}}>
                    删除后不可恢复。
                </Typography.Paragraph>
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

function statusLabel(status: ProjectStatus): string {
    return PROJECT_STATUS_OPTIONS.find((item) => item.value === status)?.label ?? status;
}
