import {useMemo, useState} from 'react';
import {ClearOutlined, DeleteOutlined, ReloadOutlined, SearchOutlined} from '@ant-design/icons';
import {
    Alert,
    Button,
    Card,
    DatePicker,
    Flex,
    Form,
    Input,
    Modal,
    Popconfirm,
    Select,
    Space,
    Table,
    Tag,
    Tooltip,
    Typography,
} from 'antd';
import type {ColumnsType} from 'antd/es/table';
import type {Dayjs} from 'dayjs';

import {logApi} from '@/api/log';
import {ApiError} from '@/api/error';
import {PagePager} from '@/components/common/PagePager';
import {useAsync} from '@/hooks/useAsync';
import {useIsMobile} from '@/hooks/useIsMobile';
import type {OperationLog, OperationType, TargetType} from '@/types';
import {
    OPERATION_LABEL,
    OPERATION_OPTIONS,
    PAGE_SIZE,
    TARGET_TYPE_LABEL,
    TARGET_TYPE_OPTIONS,
} from '@/utils/constants';
import {getStaticApi} from '@/utils/antdStatic';
import {formatDateTime} from '@/utils/format';

interface FilterValues {
    operatorId?: string;
    type?: OperationType;
    targetType?: TargetType;
    targetId?: string;
}

export function LogsPage() {
    const isMobile = useIsMobile();
    const [form] = Form.useForm<FilterValues>();

    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState<FilterValues>({});
    const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
    const [selected, setSelected] = useState<number[]>([]);

    const [clearOpen, setClearOpen] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [clearForm] = Form.useForm<{ range: [Dayjs, Dayjs] }>();

    const query = useMemo(
        () => ({
            operatorId: filters.operatorId?.trim() || undefined,
            type: filters.type,
            targetType: filters.targetType,
            targetId: filters.targetId?.trim() || undefined,
            from: range?.[0] ? range[0].format('YYYY-MM-DD') : undefined,
            to: range?.[1] ? range[1].format('YYYY-MM-DD') : undefined,
            page,
            size: PAGE_SIZE,
        }),
        [filters, range, page],
    );

    const logs = useAsync(() => logApi.list(query), [query]);
    const items = logs.data?.items ?? [];
    const meta = logs.data?.page;

    const handleBatchDelete = async () => {
        if (selected.length === 0) {
            getStaticApi()?.message.warning('请选择要删除的日志');
            return;
        }
        try {
            const result = await logApi.removeMany(selected);
            getStaticApi()?.message.success(`已删除 ${result.deleted} 条日志`);
            setSelected([]);
            logs.reload();
        } catch (error) {
            getStaticApi()?.message.error(error instanceof ApiError ? error.message : '删除失败');
        }
    };

    const handleClearByRange = async () => {
        const values = await clearForm.validateFields();
        setClearing(true);
        try {
            const result = await logApi.clearByRange(
                values.range[0].format('YYYY-MM-DD'),
                values.range[1].format('YYYY-MM-DD'),
            );
            getStaticApi()?.message.success(`已清理 ${result.deleted} 条日志`);
            setClearOpen(false);
            clearForm.resetFields();
            logs.reload();
        } catch (error) {
            getStaticApi()?.message.error(error instanceof ApiError ? error.message : '清理失败');
        } finally {
            setClearing(false);
        }
    };

    const columns: ColumnsType<OperationLog> = [
        {
            title: '时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 150,
            render: (value: string) => formatDateTime(value),
        },
        {
            title: '操作者',
            key: 'operator',
            width: 140,
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Typography.Text>{record.operatorName || record.operatorId}</Typography.Text>
                    <Typography.Text type="secondary" style={{fontSize: 12}}>
                        {record.operatorId}
                    </Typography.Text>
                </Space>
            ),
        },
        {
            title: '操作类型',
            dataIndex: 'type',
            key: 'type',
            width: 120,
            render: (value: OperationType) => <Tag color="blue">{OPERATION_LABEL[value] ?? value}</Tag>,
        },
        {
            title: '操作对象',
            key: 'target',
            width: 200,
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Typography.Text style={{fontSize: 13}}>
                        {TARGET_TYPE_LABEL[record.targetType] ?? record.targetType}
                        {record.targetName ? `：${record.targetName}` : ''}
                    </Typography.Text>
                    {record.targetId ? (
                        <Typography.Text type="secondary" style={{fontSize: 12}}>
                            ID {record.targetId}
                        </Typography.Text>
                    ) : null}
                </Space>
            ),
        },
        {
            title: '说明',
            dataIndex: 'detail',
            key: 'detail',
            render: (value: string) =>
                value ? (
                    <Typography.Text style={{fontSize: 13}} className="preserve-linebreak">
                        {value}
                    </Typography.Text>
                ) : null,
        },
        {
            title: '来源 IP',
            dataIndex: 'ip',
            key: 'ip',
            width: 130,
            responsive: ['lg'],
            render: (value: string) => (
                <Tooltip title={value}>
                    <Typography.Text type="secondary" style={{fontSize: 12}} ellipsis>
                        {value || ''}
                    </Typography.Text>
                </Tooltip>
            ),
        },
    ];

    return (
        <Space direction="vertical" size={16} style={{width: '100%'}}>
            <div className="ews-toolbar">
                <Form<FilterValues>
                    form={form}
                    layout="vertical"
                    onFinish={(values) => {
                        setFilters(values);
                        setPage(1);
                    }}
                >
                    <Flex gap={8} wrap style={{width: '100%'}}>
                        <Form.Item name="operatorId" style={{marginBottom: isMobile ? 0 : 8}}>
                            <Input allowClear placeholder="操作者学号" style={{width: isMobile ? '100%' : 150}}/>
                        </Form.Item>
                        <Form.Item name="type" style={{marginBottom: isMobile ? 0 : 8}}>
                            <Select
                                allowClear
                                placeholder="操作类型"
                                style={{width: isMobile ? '100%' : 150}}
                                options={OPERATION_OPTIONS}
                            />
                        </Form.Item>
                        <Form.Item name="targetType" style={{marginBottom: isMobile ? 0 : 8}}>
                            <Select
                                allowClear
                                placeholder="操作对象类型"
                                style={{width: isMobile ? '100%' : 150}}
                                options={TARGET_TYPE_OPTIONS}
                            />
                        </Form.Item>
                        <Form.Item name="targetId" style={{marginBottom: isMobile ? 0 : 8}}>
                            <Input allowClear placeholder="操作对象 ID" style={{width: isMobile ? '100%' : 140}}/>
                        </Form.Item>
                        <DatePicker.RangePicker
                            value={range}
                            onChange={(value) => {
                                setRange(value as [Dayjs, Dayjs] | null);
                                setPage(1);
                            }}
                            style={{marginBottom: isMobile ? 0 : 8}}
                            placeholder={['开始日期', '结束日期']}
                        />
                        <Space wrap style={{marginBottom: 8}}>
                            <Button type="primary" htmlType="submit" icon={<SearchOutlined/>}>
                                查询
                            </Button>
                            <Button
                                icon={<ReloadOutlined/>}
                                onClick={() => {
                                    form.resetFields();
                                    setFilters({});
                                    setRange(null);
                                    setPage(1);
                                }}
                            >
                                重置
                            </Button>
                            <Popconfirm
                                title={`确认删除选中的 ${selected.length} 条日志？`}
                                okText="删除"
                                cancelText="取消"
                                okButtonProps={{danger: true}}
                                onConfirm={handleBatchDelete}
                                disabled={selected.length === 0}
                            >
                                <Button icon={<DeleteOutlined/>} danger disabled={selected.length === 0}>
                                    批量删除
                                </Button>
                            </Popconfirm>
                            <Button icon={<ClearOutlined/>} danger onClick={() => setClearOpen(true)}>
                                按时间范围清理
                            </Button>
                        </Space>
                    </Flex>
                </Form>
            </div>

            <Card styles={{body: {padding: isMobile ? 0 : 8}}}>
                <Table<OperationLog>
                    rowKey="id"
                    size={isMobile ? 'small' : 'middle'}
                    columns={columns}
                    dataSource={items}
                    loading={logs.loading}
                    pagination={false}
                    scroll={{x: 900}}
                    rowSelection={{
                        selectedRowKeys: selected,
                        onChange: (keys) => setSelected(keys as number[]),
                    }}
                />
                {meta ? <PagePager page={meta} simple={isMobile} onChange={setPage}/> : null}
            </Card>

            <Modal
                open={clearOpen}
                title="按时间范围清理操作日志"
                okText="确认清理"
                cancelText="取消"
                okButtonProps={{danger: true, loading: clearing}}
                onOk={handleClearByRange}
                onCancel={() => {
                    setClearOpen(false);
                    clearForm.resetFields();
                }}
                destroyOnHidden
            >
                <Alert
                    type="warning"
                    showIcon
                    message="清理后不可恢复"
                    style={{marginBottom: 12}}
                />
                <Form form={clearForm} layout="vertical">
                    <Form.Item
                        name="range"
                        label="清理范围"
                        rules={[{required: true, message: '请选择时间范围'}]}
                    >
                        <DatePicker.RangePicker style={{width: '100%'}}/>
                    </Form.Item>
                </Form>
            </Modal>
        </Space>
    );
}
