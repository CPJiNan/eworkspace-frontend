import {useState} from 'react';
import {DeleteOutlined, EditOutlined, PlusOutlined, TagsOutlined} from '@ant-design/icons';
import {Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Table, Tabs, Tag,} from 'antd';
import type {ColumnsType} from 'antd/es/table';

import {tagApi} from '@/api/tag';
import {ApiError} from '@/api/error';
import {useAsync} from '@/hooks/useAsync';
import {useIsMobile} from '@/hooks/useIsMobile';
import type {Semester, Tag as TagModel, TagType} from '@/types';
import {TEXT_LIMIT} from '@/utils/constants';
import {getStaticApi} from '@/utils/antdStatic';

type TabKey = 'semester' | 'project' | 'division';

const TAB_META: { key: TabKey; label: string }[] = [
    {key: 'semester', label: '学期'},
    {key: 'project', label: '项目标签'},
    {key: 'division', label: '分工标签'},
];

export function TagManagerCard() {
    const isMobile = useIsMobile();
    const [activeTab, setActiveTab] = useState<TabKey>('semester');
    const [nameModal, setNameModal] = useState<{ mode: 'create' | 'rename'; id?: number } | null>(
        null,
    );
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm<{ name: string; type?: TagType }>();

    const semesters = useAsync(() => tagApi.listSemesters(), []);
    const tags = useAsync(() => tagApi.list(), []);

    const reloadAll = () => {
        semesters.reload();
        tags.reload();
    };

    const openCreate = () => {
        form.resetFields();
        setNameModal({mode: 'create'});
    };

    const openRename = (id: number, name: string) => {
        form.setFieldsValue({name});
        setNameModal({mode: 'rename', id});
    };

    const handleSubmit = async () => {
        const values = await form.validateFields();
        setSubmitting(true);
        try {
            if (nameModal?.mode === 'create') {
                if (activeTab === 'semester') {
                    await tagApi.createSemester(values.name.trim());
                } else {
                    await tagApi.create(values.name.trim(), activeTab as TagType);
                }
                getStaticApi()?.message.success('已创建');
            } else if (nameModal?.id) {
                if (activeTab === 'semester') {
                    await tagApi.renameSemester(nameModal.id, values.name.trim());
                } else {
                    await tagApi.rename(nameModal.id, values.name.trim());
                }
                getStaticApi()?.message.success('已重命名');
            }
            setNameModal(null);
            form.resetFields();
            reloadAll();
        } catch (error) {
            getStaticApi()?.message.error(error instanceof ApiError ? error.message : '操作失败');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteSemester = async (item: Semester) => {
        try {
            await tagApi.removeSemester(item.id);
            getStaticApi()?.message.success('学期已删除');
            reloadAll();
        } catch (error) {
            getStaticApi()?.message.error(error instanceof ApiError ? error.message : '删除失败');
        }
    };

    const handleDeleteTag = async (item: TagModel) => {
        try {
            await tagApi.remove(item.id);
            getStaticApi()?.message.success('标签已删除');
            reloadAll();
        } catch (error) {
            getStaticApi()?.message.error(error instanceof ApiError ? error.message : '删除失败');
        }
    };

    const semesterColumns: ColumnsType<Semester> = [
        {title: '学期名称', dataIndex: 'name', key: 'name'},
        {
            title: '操作',
            key: 'action',
            width: 160,
            render: (_, record) => (
                <Space size={0}>
                    <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined/>}
                        onClick={() => {
                            openRename(record.id, record.name);
                        }}
                    >
                        重命名
                    </Button>
                    <Popconfirm
                        title="确认删除该学期？"
                        description="仅删除学期本身，已关联的项目会解除该学期归属。"
                        okText="删除"
                        cancelText="取消"
                        okButtonProps={{danger: true}}
                        onConfirm={() => handleDeleteSemester(record)}
                    >
                        <Button type="link" size="small" danger icon={<DeleteOutlined/>}>
                            删除
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const tagColumns: ColumnsType<TagModel> = [
        {title: '标签名称', dataIndex: 'name', key: 'name'},
        {
            title: '类型',
            dataIndex: 'type',
            key: 'type',
            width: 100,
            render: (value: TagType) => (
                <Tag color={value === 'project' ? 'blue' : 'purple'}>
                    {value === 'project' ? '项目' : '分工'}
                </Tag>
            ),
        },
        {
            title: '操作',
            key: 'action',
            width: 160,
            render: (_, record) => (
                <Space size={0}>
                    <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined/>}
                        onClick={() => {
                            openRename(record.id, record.name);
                        }}
                    >
                        重命名
                    </Button>
                    <Popconfirm
                        title="确认删除该标签？"
                        okText="删除"
                        cancelText="取消"
                        okButtonProps={{danger: true}}
                        onConfirm={() => handleDeleteTag(record)}
                    >
                        <Button type="link" size="small" danger icon={<DeleteOutlined/>}>
                            删除
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const currentTags = (tags.data?.items ?? []).filter((item) => item.type === activeTab);

    return (
        <Card
            title={
                <Space size={6}>
                    <TagsOutlined/>
                    <span>学期与标签管理</span>
                </Space>
            }
            extra={
                <Button type="primary" icon={<PlusOutlined/>} onClick={openCreate}>
                    {activeTab === 'semester' ? '新增学期' : '新增标签'}
                </Button>
            }
            style={{marginTop: 16}}
        >
            <Tabs
                activeKey={activeTab}
                onChange={(key) => {
                    setActiveTab(key as TabKey);
                }}
                items={TAB_META.map((item) => ({key: item.key, label: item.label}))}
            />

            {activeTab === 'semester' ? (
                <Table<Semester>
                    rowKey="id"
                    size={isMobile ? 'small' : 'middle'}
                    columns={semesterColumns}
                    dataSource={semesters.data?.items ?? []}
                    loading={semesters.loading}
                    pagination={false}
                />
            ) : (
                <Table<TagModel>
                    rowKey="id"
                    size={isMobile ? 'small' : 'middle'}
                    columns={tagColumns}
                    dataSource={currentTags}
                    loading={tags.loading}
                    pagination={false}
                />
            )}

            <Modal
                open={Boolean(nameModal)}
                title={
                    nameModal?.mode === 'create'
                        ? activeTab === 'semester'
                            ? '新增学期'
                            : '新增标签'
                        : activeTab === 'semester'
                            ? '重命名学期'
                            : '重命名标签'
                }
                okText="保存"
                cancelText="取消"
                confirmLoading={submitting}
                onOk={handleSubmit}
                onCancel={() => {
                    setNameModal(null);
                    form.resetFields();
                }}
                destroyOnHidden
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="name"
                        label="名称"
                        rules={[
                            {required: true, message: '请输入名称'},
                            {max: TEXT_LIMIT.short, message: `不超过 ${TEXT_LIMIT.short} 字`},
                        ]}
                    >
                        <Input placeholder="名称"/>
                    </Form.Item>
                    {nameModal?.mode === 'create' && activeTab !== 'semester' ? (
                        <Select
                            value={activeTab}
                            style={{width: '100%'}}
                            onChange={(value) => {
                                setActiveTab(value as TabKey);
                            }}
                            options={[
                                {value: 'project', label: '项目标签'},
                                {value: 'division', label: '分工标签'},
                            ]}
                        />
                    ) : null}
                </Form>
            </Modal>
        </Card>
    );
}
