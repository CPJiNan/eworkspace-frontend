import {useEffect, useMemo, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {ArrowLeftOutlined, DeleteOutlined, PlusOutlined, SaveOutlined} from '@ant-design/icons';
import {Alert, Button, Card, Col, DatePicker, Form, Input, InputNumber, Row, Select, Space, Tooltip,} from 'antd';
import dayjs, {type Dayjs} from 'dayjs';

import {projectApi} from '@/api/project';
import {tagApi} from '@/api/tag';
import {ApiError} from '@/api/error';
import {LoadingBlock} from '@/components/common/StateBlocks';
import {CountedTextArea} from '@/components/common/CountedTextArea';
import {useAsync} from '@/hooks/useAsync';
import type {AssignmentPayload, ProjectStatus} from '@/types';
import {MAX_ASSIGNMENTS, MAX_CAPACITY, MAX_WORKLOAD, PROJECT_STATUS_OPTIONS, TEXT_LIMIT,} from '@/utils/constants';
import {getStaticApi} from '@/utils/antdStatic';

interface AssignmentFormItem {
    id?: number;
    name: string;
    description?: string;
    capacity: number;
    workload: number;
    tagId?: number | null;
    deadline?: Dayjs | null;
    claimedCount?: number;
}

interface ProjectFormValues {
    name: string;
    description?: string;
    deadline: Dayjs;
    status?: ProjectStatus;
    semesterIds?: number[];
    tagIds?: number[];
    assignments: AssignmentFormItem[];
}

export function ProjectFormPage() {
    const {id} = useParams<{ id: string }>();
    const projectId = id ? Number(id) : undefined;
    const isEdit = Boolean(projectId);
    const navigate = useNavigate();
    const [form] = Form.useForm<ProjectFormValues>();
    const [submitting, setSubmitting] = useState(false);

    const semesters = useAsync(() => tagApi.listSemesters(), []);
    const tags = useAsync(() => tagApi.list('project'), []);
    const divisionTags = useAsync(() => tagApi.list('division'), []);

    const detail = useAsync(() => projectApi.detail(projectId as number), [projectId], {
        enabled: isEdit,
    });

    const initialValues = useMemo<Partial<ProjectFormValues> | undefined>(() => {
        if (!isEdit) {
            return {
                assignments: [{name: '', description: '', capacity: 1, workload: 1, tagId: null, deadline: null}],
                semesterIds: [],
                tagIds: [],
                status: 'active',
                deadline: dayjs().hour(23).minute(59).second(0).millisecond(0),
            };
        }
        const project = detail.data;
        if (!project) return undefined;
        return {
            name: project.name,
            description: project.description,
            deadline: dayjs(project.deadline),
            status: project.status,
            semesterIds: project.semesters.map((item) => item.id),
            tagIds: project.tags.map((item) => item.id),
            assignments: project.assignments.map((assignment) => ({
                id: assignment.id,
                name: assignment.name,
                description: assignment.description,
                capacity: assignment.capacity,
                workload: assignment.workload,
                tagId: assignment.tagId ?? null,
                deadline: assignment.deadline ? dayjs(assignment.deadline) : null,
                claimedCount: assignment.claimedCount,
            })),
        };
    }, [isEdit, detail.data]);

    useEffect(() => {
        if (initialValues) {
            form.setFieldsValue(initialValues as ProjectFormValues);
        }
    }, [initialValues, form]);

    const handleSubmit = async (values: ProjectFormValues) => {
        setSubmitting(true);
        try {
            const assignments: AssignmentPayload[] = values.assignments.map((item) => ({
                id: item.id,
                name: item.name.trim(),
                description: item.description?.trim() ?? '',
                capacity: item.capacity,
                workload: item.workload,
                tagId: item.tagId ?? null,
                deadline: item.deadline ? item.deadline.toISOString() : null,
            }));

            if (isEdit && projectId) {
                await projectApi.update(projectId, {
                    name: values.name.trim(),
                    description: values.description?.trim() ?? '',
                    deadline: values.deadline.toISOString(),
                    status: values.status,
                    semesterIds: values.semesterIds ?? [],
                    tagIds: values.tagIds ?? [],
                    assignments,
                });
                getStaticApi()?.message.success('项目已更新');
            } else {
                await projectApi.create({
                    name: values.name.trim(),
                    description: values.description?.trim() ?? '',
                    deadline: values.deadline.toISOString(),
                    semesterIds: values.semesterIds ?? [],
                    tagIds: values.tagIds ?? [],
                    assignments,
                });
                getStaticApi()?.message.success('项目已发布');
            }
            navigate('/admin/projects');
        } catch (error) {
            getStaticApi()?.message.error(error instanceof ApiError ? error.message : '保存失败');
        } finally {
            setSubmitting(false);
        }
    };

    if (isEdit && detail.loading && !detail.data) return <LoadingBlock rows={6}/>;
    if (isEdit && detail.error) {
        return (
            <Space direction="vertical" size={16} style={{width: '100%'}}>
                <Alert
                    type="error"
                    showIcon
                    message="加载项目失败"
                    description={detail.error.message}
                    action={<Button onClick={detail.reload}>重试</Button>}
                />
                <div>
                    <Button icon={<ArrowLeftOutlined/>} onClick={() => {
                        navigate('/admin/projects');
                    }}>
                        返回项目管理
                    </Button>
                </div>
            </Space>
        );
    }

    const semesterOptions = (semesters.data?.items ?? []).map((item) => ({
        value: item.id,
        label: item.name,
    }));
    const tagOptions = (tags.data?.items ?? []).map((item) => ({value: item.id, label: item.name}));
    const divisionOptions = (divisionTags.data?.items ?? []).map((item) => ({
        value: item.id,
        label: item.name,
    }));

    return (
        <Space direction="vertical" size={16} style={{width: '100%'}}>
            <Button icon={<ArrowLeftOutlined/>} onClick={() => {
                navigate('/admin/projects');
            }}>
                返回项目管理
            </Button>

            <Form<ProjectFormValues>
                form={form}
                layout="vertical"
                initialValues={initialValues}
                onFinish={handleSubmit}
                scrollToFirstError
            >
                <Card title={isEdit ? '编辑项目' : '发布项目'}>
                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="name"
                                label="项目名称"
                                rules={[
                                    {required: true, message: '请输入项目名称'},
                                    {max: TEXT_LIMIT.short, message: `不超过 ${TEXT_LIMIT.short} 字`},
                                ]}
                            >
                                <Input placeholder="项目名称" maxLength={TEXT_LIMIT.short}/>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="deadline"
                                label="截止时间"
                                rules={[{required: true, message: '请选择截止时间'}]}
                            >
                                <DatePicker
                                    showTime={{format: 'HH:mm'}}
                                    format="YYYY-MM-DD HH:mm"
                                    style={{width: '100%'}}
                                    placeholder="选择日期与时间"
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="description"
                        label="项目描述"
                        rules={[{max: TEXT_LIMIT.long, message: `不超过 ${TEXT_LIMIT.long} 字`}]}
                    >
                        <CountedTextArea
                            limit={TEXT_LIMIT.long}
                            autoSize={{minRows: 3, maxRows: 8}}
                            placeholder="项目描述"
                        />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col xs={24} md={8}>
                            <Form.Item name="semesterIds" label="学期">
                                <Select
                                    mode="multiple"
                                    allowClear
                                    placeholder="选择所属学期"
                                    options={semesterOptions}
                                    loading={semesters.loading}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="tagIds" label="项目标签">
                                <Select
                                    mode="multiple"
                                    allowClear
                                    placeholder="选择项目标签"
                                    options={tagOptions}
                                    loading={tags.loading}
                                />
                            </Form.Item>
                        </Col>
                        {isEdit ? (
                            <Col xs={24} md={8}>
                                <Form.Item name="status" label="项目状态">
                                    <Select options={PROJECT_STATUS_OPTIONS}/>
                                </Form.Item>
                            </Col>
                        ) : null}
                    </Row>
                </Card>

                <Card
                    title="具体分工"
                    style={{marginTop: 16}}
                >
                    <Form.List
                        name="assignments"
                        rules={[
                            {
                                validator: async (_, value: AssignmentFormItem[] | undefined) => {
                                    if (!value || value.length === 0) {
                                        return Promise.reject(new Error('项目至少需要一个具体分工'));
                                    }
                                    if (value.length > MAX_ASSIGNMENTS) {
                                        return Promise.reject(new Error(`分工数量不能超过 ${MAX_ASSIGNMENTS} 个`));
                                    }
                                    return Promise.resolve();
                                },
                            },
                        ]}
                    >
                        {(fields, {add, remove}, {errors}) => (
                            <>
                                {fields.map((field) => (
                                    <div key={field.key} style={{marginBottom: 8}}>
                                        <Row gutter={8} align="top">
                                            <Col xs={24} sm={6}>
                                                <Form.Item
                                                    name={[field.name, 'name']}
                                                    label={field.name === 0 ? '分工名称' : undefined}
                                                    rules={[
                                                        {required: true, message: '请输入分工名称'},
                                                        {
                                                            max: TEXT_LIMIT.short,
                                                            message: `不超过 ${TEXT_LIMIT.short} 字`,
                                                        },
                                                    ]}
                                                    style={{marginBottom: 8}}
                                                >
                                                    <Input placeholder="分工名称" maxLength={TEXT_LIMIT.short}/>
                                                </Form.Item>
                                            </Col>
                                            <Col xs={12} sm={4}>
                                                <Form.Item
                                                    name={[field.name, 'capacity']}
                                                    label={field.name === 0 ? '负责人人数' : undefined}
                                                    rules={[
                                                        {required: true, message: '请输入人数'},
                                                        {
                                                            type: 'number',
                                                            min: 1,
                                                            max: MAX_CAPACITY,
                                                            message: `人数为 1-${MAX_CAPACITY}`,
                                                        },
                                                    ]}
                                                    style={{marginBottom: 8}}
                                                >
                                                    <CapacityInput
                                                        claimedCount={form.getFieldValue(['assignments', field.name, 'claimedCount'])}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={12} sm={3}>
                                                <Form.Item
                                                    name={[field.name, 'workload']}
                                                    label={field.name === 0 ? '工作量' : undefined}
                                                    rules={[
                                                        {required: true, message: '请输入工作量'},
                                                        {
                                                            type: 'number',
                                                            min: 1,
                                                            max: MAX_WORKLOAD,
                                                            message: `工作量为 1-${MAX_WORKLOAD}`,
                                                        },
                                                    ]}
                                                    style={{marginBottom: 8}}
                                                >
                                                    <WorkloadInput/>
                                                </Form.Item>
                                            </Col>
                                            <Col xs={12} sm={4}>
                                                <Form.Item
                                                    name={[field.name, 'tagId']}
                                                    label={field.name === 0 ? '分工标签' : undefined}
                                                    style={{marginBottom: 8}}
                                                >
                                                    <Select
                                                        allowClear
                                                        placeholder="选择分工标签"
                                                        options={divisionOptions}
                                                        loading={divisionTags.loading}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} sm={4}>
                                                <Form.Item
                                                    name={[field.name, 'deadline']}
                                                    label={field.name === 0 ? '分工截止时间' : undefined}
                                                    style={{marginBottom: 8}}
                                                >
                                                    <DatePicker
                                                        showTime={{
                                                            format: 'HH:mm',
                                                            defaultOpenValue: dayjs()
                                                                .hour(23)
                                                                .minute(59)
                                                                .second(59)
                                                                .millisecond(0),
                                                        }}
                                                        format="YYYY-MM-DD HH:mm"
                                                        style={{width: '100%'}}
                                                        placeholder="选择日期与时间"
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} sm={3}>
                                                <Form.Item
                                                    label={field.name === 0 ? '操作' : undefined}
                                                    style={{marginBottom: 8}}
                                                >
                                                    <Space>
                                                        <Tooltip
                                                            title={fields.length <= 1 ? '至少保留一个分工' : '删除该分工'}>
                                                            <Button
                                                                danger
                                                                icon={<DeleteOutlined/>}
                                                                disabled={fields.length <= 1}
                                                                onClick={() => {
                                                                    remove(field.name);
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    </Space>
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Row gutter={8}>
                                            <Col span={24}>
                                                <Form.Item
                                                    name={[field.name, 'description']}
                                                    label={field.name === 0 ? '分工描述' : undefined}
                                                    rules={[
                                                        {
                                                            max: TEXT_LIMIT.long,
                                                            message: `不超过 ${TEXT_LIMIT.long} 字`,
                                                        },
                                                    ]}
                                                    style={{marginBottom: 8}}
                                                >
                                                    <CountedTextArea
                                                        limit={TEXT_LIMIT.long}
                                                        autoSize={{minRows: 2, maxRows: 4}}
                                                        placeholder="分工描述"
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Form.Item name={[field.name, 'id']} hidden>
                                            <Input/>
                                        </Form.Item>
                                        <Form.Item name={[field.name, 'claimedCount']} hidden>
                                            <InputNumber/>
                                        </Form.Item>
                                    </div>
                                ))}

                                <Form.ErrorList errors={errors}/>
                                <Button
                                    type="dashed"
                                    block
                                    icon={<PlusOutlined/>}
                                    onClick={() => {
                                        add({
                                            name: '',
                                            description: '',
                                            capacity: 1,
                                            workload: 1,
                                            tagId: null,
                                            deadline: null,
                                        });
                                    }}
                                    disabled={fields.length >= MAX_ASSIGNMENTS}
                                >
                                    添加分工
                                </Button>
                            </>
                        )}
                    </Form.List>
                </Card>

                <Card style={{marginTop: 16}}>
                    <Space wrap>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined/>} loading={submitting}>
                            {isEdit ? '保存修改' : '发布项目'}
                        </Button>
                        <Button onClick={() => {
                            navigate('/admin/projects');
                        }}>取消</Button>
                    </Space>
                </Card>
            </Form>
        </Space>
    );
}

interface WorkloadInputProps {
    value?: number | null;
    onChange?: (value: number | null) => void;
}

function WorkloadInput({value, onChange}: WorkloadInputProps) {
    return (
        <Tooltip title="申领该分工后计入的工作量">
            <InputNumber
                style={{width: '100%'}}
                min={1}
                max={MAX_WORKLOAD}
                precision={0}
                value={value ?? undefined}
                onChange={onChange}
                placeholder="工作量"
            />
        </Tooltip>
    );
}

interface CapacityInputProps {
    claimedCount?: number;
    value?: number | null;
    onChange?: (value: number | null) => void;
}

function CapacityInput({claimedCount, value, onChange}: CapacityInputProps) {
    const claimed = claimedCount ?? 0;
    const min = Math.max(1, claimed);
    return (
        <Tooltip title={claimed > 0 ? `已有 ${claimed} 人申领` : undefined}>
            <InputNumber
                style={{width: '100%'}}
                min={min}
                max={MAX_CAPACITY}
                precision={0}
                value={value ?? undefined}
                onChange={onChange}
                placeholder="负责人人数"
            />
        </Tooltip>
    );
}
