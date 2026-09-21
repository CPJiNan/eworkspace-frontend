import {useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {PlusOutlined, ReloadOutlined, SearchOutlined} from '@ant-design/icons';
import {Button, Card, Flex, Form, Input, Modal, Popconfirm, Result, Select, Space, Table, Tag, Typography,} from 'antd';
import type {ColumnsType} from 'antd/es/table';

import {userApi} from '@/api/user';
import {ApiError} from '@/api/error';
import {PagePager} from '@/components/common/PagePager';
import {useAsync} from '@/hooks/useAsync';
import {useIsMobile} from '@/hooks/useIsMobile';
import {canManage, isSuperAdmin, useAuthStore} from '@/stores/authStore';
import {type CreateAccountResult, Role, type User} from '@/types';
import {PAGE_SIZE, ROLE_META, ROLE_OPTIONS, TEXT_LIMIT} from '@/utils/constants';
import {getStaticApi} from '@/utils/antdStatic';
import {formatDateTime} from '@/utils/format';

interface CreateFormValues {
    studentId: string;
    role: Role;
    name?: string;
    phone?: string;
    wechat?: string;
    qq?: string;
    email?: string;
}

type BanScope = 'all' | 'normal' | 'banned';

export function MembersPage() {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const currentUser = useAuthStore((state) => state.user);
    const superAdmin = isSuperAdmin(currentUser?.role);

    const [page, setPage] = useState(1);
    const [keyword, setKeyword] = useState('');
    const [searchKey, setSearchKey] = useState('');
    const [roleFilter, setRoleFilter] = useState<Role | undefined>(undefined);
    const [banScope, setBanScope] = useState<BanScope>('all');

    const [createOpen, setCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createResult, setCreateResult] = useState<CreateAccountResult[] | null>(null);
    const [createForm] = Form.useForm<CreateFormValues>();
    // 新增账号一次只创建一个账号，因此结果区只需区分成功 / 失败。
    const createSucceeded = Boolean(createResult?.some((item) => item.created));

    const [resetTarget, setResetTarget] = useState<User | null>(null);
    const [resetting, setResetting] = useState(false);
    const [resetForm] = Form.useForm<{ newPassword?: string }>();

    const query = useMemo(
        () => ({
            keyword: searchKey || undefined,
            role: roleFilter,
            banned: banScope === 'all' ? undefined : banScope === 'banned',
            page,
            size: PAGE_SIZE,
        }),
        [searchKey, roleFilter, banScope, page],
    );

    const members = useAsync(() => userApi.listMembers(query), [query]);
    const items = members.data?.items ?? [];
    const meta = members.data?.page;

    const handleCreate = async (values: CreateFormValues) => {
        const studentId = values.studentId.trim();
        if (!studentId) {
            getStaticApi()?.message.warning('请输入学号');
            return;
        }

        setCreating(true);
        try {
            const payload = {
                studentIds: [studentId],
                role: values.role ?? Role.User,
                name: values.name?.trim(),
                phone: values.phone?.trim(),
                wechat: values.wechat?.trim(),
                qq: values.qq?.trim(),
                email: values.email?.trim(),
            };
            const result = await userApi.createAccounts(payload);
            setCreateResult(result.results);
            if (result.success > 0) {
                getStaticApi()?.message.success('账号已创建');
            }
            if (result.failed > 0) {
                getStaticApi()?.message.warning('账号未创建');
            }
            members.reload();
        } catch (error) {
            getStaticApi()?.message.error(error instanceof ApiError ? error.message : '创建失败');
        } finally {
            setCreating(false);
        }
    };

    const handleSetBanned = async (member: User, banned: boolean) => {
        try {
            await userApi.setBanned(member.studentId, banned);
            getStaticApi()?.message.success(banned ? '已封禁该账号' : '已解封该账号');
            members.reload();
        } catch (error) {
            getStaticApi()?.message.error(error instanceof ApiError ? error.message : '操作失败');
        }
    };

    const handleResetPassword = async () => {
        if (!resetTarget) return;
        const values = await resetForm.validateFields();
        setResetting(true);
        try {
            const result = await userApi.resetPassword(resetTarget.studentId, values.newPassword?.trim());
            getStaticApi()?.message.success(`密码已重置为：${result.initialPassword}`);
            setResetTarget(null);
            resetForm.resetFields();
            members.reload();
        } catch (error) {
            getStaticApi()?.message.error(error instanceof ApiError ? error.message : '重置失败');
        } finally {
            setResetting(false);
        }
    };

    const handleDeleteAccount = async (member: User) => {
        try {
            await userApi.deleteAccount(member.studentId);
            members.reload();
        } catch (error) {
            getStaticApi()?.message.error(error instanceof ApiError ? error.message : '删除失败');
        }
    };

    const columns: ColumnsType<User> = [
        {
            title: '姓名',
            key: 'name',
            render: (_, record) => (
                <Space direction="vertical" size={2}>
                    <Typography.Link onClick={() => navigate(`/admin/members/${record.studentId}`)}>
                        {record.name || '未命名用户'}
                    </Typography.Link>
                    <Typography.Text type="secondary" style={{fontSize: 12}}>
                        {record.studentId}
                    </Typography.Text>
                </Space>
            ),
        },
        {
            title: '手机号',
            dataIndex: 'phone',
            key: 'phone',
            width: 130,
            render: (value: string) => value || '',
        },
        {
            title: '微信号',
            dataIndex: 'wechat',
            key: 'wechat',
            width: 130,
            render: (value: string) => value || '',
        },
        {
            title: 'QQ 号',
            dataIndex: 'qq',
            key: 'qq',
            width: 110,
            render: (value: string) => value || '',
        },
        {
            title: '角色',
            dataIndex: 'role',
            key: 'role',
            width: 110,
            render: (value: Role) => {
                const metaItem = ROLE_META[value];
                return <Tag color={metaItem.color}>{metaItem.label}</Tag>;
            },
        },
        {
            title: '状态',
            key: 'status',
            width: 150,
            render: (_, record) => (
                <Space direction="vertical" size={2}>
                    {record.banned ? <Tag color="red">已封禁</Tag> : <Tag color="green">正常</Tag>}
                    {record.mustChangePassword ? (
                        <Typography.Text type="secondary" style={{fontSize: 12}}>
                            待修改密码
                        </Typography.Text>
                    ) : null}
                </Space>
            ),
        },
        {
            title: '注册时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 150,
            render: (value: string) => formatDateTime(value),
        },
        {
            title: '操作',
            key: 'action',
            width: 220,
            fixed: isMobile ? undefined : 'right',
            render: (_, record) => (
                <Space size={0} wrap>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => navigate(`/admin/members/${record.studentId}`)}
                    >
                        编辑
                    </Button>
                    <Button type="link" size="small" onClick={() => setResetTarget(record)}>
                        重置密码
                    </Button>
                    {record.role === Role.SuperAdmin ? (
                        <Typography.Text type="secondary" style={{fontSize: 12}}>
                            系统内置
                        </Typography.Text>
                    ) : (
                        <Popconfirm
                            title={record.banned ? '确认解封该账号？' : '确认封禁该账号？'}
                            okText="确认"
                            cancelText="取消"
                            okButtonProps={{danger: !record.banned}}
                            onConfirm={() => handleSetBanned(record, !record.banned)}
                        >
                            <Button type="link" size="small" danger={!record.banned}>
                                {record.banned ? '解封' : '封禁'}
                            </Button>
                        </Popconfirm>
                    )}
                    {canManage(currentUser?.role) &&
                    record.role !== Role.SuperAdmin &&
                    (record.role !== Role.Admin || superAdmin) ? (
                        <Popconfirm
                            title={record.role === Role.Admin ? '确认删除该管理员账号？' : '确认删除该成员账号？'}
                            okText="确认删除"
                            cancelText="取消"
                            okButtonProps={{danger: true}}
                            onConfirm={() => handleDeleteAccount(record)}
                        >
                            <Button type="link" size="small" danger>
                                删除
                            </Button>
                        </Popconfirm>
                    ) : null}
                </Space>
            ),
        },
    ];

    const openCreate = () => {
        setCreateResult(null);
        createForm.resetFields();
        createForm.setFieldsValue({role: Role.User});
        setCreateOpen(true);
    };

    return (
        <Space direction="vertical" size={16} style={{width: '100%'}}>
            <div className="ews-toolbar">
                <Flex gap={8} wrap align="center">
                    <Input
                        allowClear
                        value={keyword}
                        onChange={(event) => setKeyword(event.target.value)}
                        onPressEnter={() => {
                            setSearchKey(keyword.trim());
                            setPage(1);
                        }}
                        prefix={<SearchOutlined/>}
                        placeholder="搜索学号、姓名、手机号、微信号、QQ 号"
                        style={{flex: 1, minWidth: 200}}
                    />
                    <Select<Role | undefined>
                        allowClear
                        value={roleFilter}
                        placeholder="全部角色"
                        style={{width: 130}}
                        onChange={(value) => {
                            setRoleFilter(value);
                            setPage(1);
                        }}
                        options={[
                            {value: Role.SuperAdmin, label: ROLE_META[Role.SuperAdmin].label},
                            ...ROLE_OPTIONS,
                        ]}
                    />
                    <Select<BanScope>
                        value={banScope}
                        style={{width: 120}}
                        onChange={(value) => {
                            setBanScope(value);
                            setPage(1);
                        }}
                        options={[
                            {value: 'all', label: '全部状态'},
                            {value: 'normal', label: '正常'},
                            {value: 'banned', label: '已封禁'},
                        ]}
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
                    <Button icon={<ReloadOutlined/>} onClick={members.reload} loading={members.loading}>
                        刷新
                    </Button>
                    <Button type="primary" icon={<PlusOutlined/>} onClick={openCreate}>
                        新增账号
                    </Button>
                </Flex>
            </div>

            <Card styles={{body: {padding: isMobile ? 0 : 8}}}>
                <Table<User>
                    rowKey="studentId"
                    size={isMobile ? 'small' : 'middle'}
                    columns={columns}
                    dataSource={items}
                    loading={members.loading}
                    pagination={false}
                    scroll={{x: 1100}}
                />
                {meta ? <PagePager page={meta} simple={isMobile} onChange={setPage}/> : null}
            </Card>

            <Modal
                open={createOpen}
                title="新增账号"
                confirmLoading={creating}
                onOk={() => createForm.submit()}
                onCancel={() => {
                    setCreateOpen(false);
                    setCreateResult(null);
                    createForm.resetFields();
                }}
                footer={
                    createResult
                        ? [
                            <Button
                                key="close"
                                onClick={() => {
                                    setCreateOpen(false);
                                    setCreateResult(null);
                                    createForm.resetFields();
                                }}
                            >
                                关闭
                            </Button>,
                        ]
                        : undefined
                }
                width={560}
                destroyOnHidden
            >
                {createResult ? (
                    <Result
                        status={createSucceeded ? 'success' : 'warning'}
                        title={createSucceeded ? '成功' : '失败'}
                    >
                        <Table<CreateAccountResult>
                            rowKey="studentId"
                            size="small"
                            pagination={false}
                            dataSource={createResult}
                            columns={[
                                {title: '学号', dataIndex: 'studentId', width: 140},
                                {
                                    title: '结果',
                                    key: 'result',
                                    render: (_, record) =>
                                        record.created ? (
                                            <Space direction="vertical" size={0}>
                                                <Tag color="green">已创建</Tag>
                                                <Typography.Text code copyable style={{fontSize: 12}}>
                                                    {record.initialPassword}
                                                </Typography.Text>
                                            </Space>
                                        ) : (
                                            <Typography.Text type="danger" style={{fontSize: 12}}>
                                                {record.error ?? '创建失败'}
                                            </Typography.Text>
                                        ),
                                },
                            ]}
                        />
                        <Button
                            style={{marginTop: 12}}
                            onClick={() => {
                                setCreateResult(null);
                                createForm.resetFields(['studentId']);
                            }}
                        >
                            继续创建
                        </Button>
                    </Result>
                ) : (
                    <Form<CreateFormValues>
                        form={createForm}
                        layout="vertical"
                        onFinish={handleCreate}
                        initialValues={{role: Role.User}}
                    >
                        <Form.Item
                            name="studentId"
                            label="学号"
                            rules={[
                                {required: true, message: '请输入学号'},
                                {pattern: /^\d{1,20}$/, message: '学号必须是 11 位数字'},
                            ]}
                        >
                            <Input placeholder="学号" maxLength={20} inputMode="numeric"/>
                        </Form.Item>

                        <Form.Item name="role" label="角色" rules={[{required: true}]}>
                            <Select options={ROLE_OPTIONS} disabled={!superAdmin}/>
                        </Form.Item>

                        <Form.Item
                            name="name"
                            label="姓名"
                            rules={[
                                {required: true, message: '请输入姓名'},
                                {max: TEXT_LIMIT.short, message: `不超过 ${TEXT_LIMIT.short} 字`},
                            ]}
                        >
                            <Input placeholder="姓名"/>
                        </Form.Item>
                        <Form.Item
                            name="phone"
                            label="手机号"
                            rules={[{pattern: /^1\d{10}$/, message: '手机号格式不正确'}]}
                        >
                            <Input placeholder="手机号" maxLength={11}/>
                        </Form.Item>
                        <Form.Item name="wechat" label="微信号">
                            <Input placeholder="微信号"/>
                        </Form.Item>
                        <Form.Item name="qq" label="QQ 号" rules={[{pattern: /^\d{0,20}$/, message: '必须是数字'}]}>
                            <Input placeholder="QQ 号" maxLength={20}/>
                        </Form.Item>
                        <Form.Item
                            name="email"
                            label="邮箱"
                            rules={[{type: 'email', message: '邮箱格式不正确'}]}
                        >
                            <Input placeholder="学号@m.fudan.edu.cn"/>
                        </Form.Item>
                    </Form>
                )}
            </Modal>

            <Modal
                open={Boolean(resetTarget)}
                title={`重置密码：${resetTarget?.name ?? ''}（${resetTarget?.studentId ?? ''}）`}
                okText="确认重置"
                cancelText="取消"
                confirmLoading={resetting}
                onOk={handleResetPassword}
                onCancel={() => {
                    setResetTarget(null);
                    resetForm.resetFields();
                }}
                destroyOnHidden
            >
                <Form form={resetForm} layout="vertical">
                    <Form.Item
                        name="newPassword"
                        label="新密码"
                        rules={[
                            {
                                validator: (_, value?: string) => {
                                    if (!value) return Promise.resolve();
                                    if (value.length < 8) return Promise.reject(new Error('长度至少 8 位'));
                                    if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(value)) {
                                        return Promise.reject(new Error('必须同时包含字母和数字'));
                                    }
                                    return Promise.resolve();
                                },
                            },
                        ]}
                    >
                        <Input.Password placeholder="留空使用默认密码"/>
                    </Form.Item>
                </Form>
            </Modal>
        </Space>
    );
}
