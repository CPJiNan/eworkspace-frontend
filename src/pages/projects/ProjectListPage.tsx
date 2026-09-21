import {useCallback, useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {FilterOutlined, ReloadOutlined, SearchOutlined} from '@ant-design/icons';
import {
    Button,
    Card,
    Col,
    DatePicker,
    Empty,
    Flex,
    Form,
    Input,
    List,
    Row,
    Segmented,
    Select,
    Space,
    Tag,
    Typography,
} from 'antd';
import type {Dayjs} from 'dayjs';

import {projectApi} from '@/api/project';
import {tagApi} from '@/api/tag';
import {AssignmentCapacity} from '@/components/common/AssignmentCapacity';
import {ErrorBlock, LoadingBlock} from '@/components/common/StateBlocks';
import {PagePager} from '@/components/common/PagePager';
import {ProjectStatusTag} from '@/components/common/ProjectStatusTag';
import {useAsync} from '@/hooks/useAsync';
import {useIsMobile} from '@/hooks/useIsMobile';
import type {Project, ProjectStatus} from '@/types';
import {PAGE_SIZE} from '@/utils/constants';
import {formatDeadline, truncate} from '@/utils/format';

interface FilterForm {
    keyword?: string;
    semesterId?: number;
    tagId?: number;
}

type ScopeValue = 'all' | 'active' | 'finished' | 'cancelled';

const SCOPE_OPTIONS: { value: ScopeValue; label: string }[] = [
    {value: 'all', label: '全部'},
    {value: 'active', label: '进行中'},
    {value: 'finished', label: '已结束'},
    {value: 'cancelled', label: '已取消'},
];

const DEFAULT_SCOPE: ScopeValue = 'all';

export function ProjectListPage() {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const [form] = Form.useForm<FilterForm>();

    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState<FilterForm>({});
    const [scope, setScope] = useState<ScopeValue>(DEFAULT_SCOPE);
    const [deadlineRange, setDeadlineRange] = useState<[Dayjs, Dayjs] | null>(null);

    const semesters = useAsync(() => tagApi.listSemesters(), []);
    const tags = useAsync(() => tagApi.list('project'), []);

    const query = useMemo(() => {
        const status: ProjectStatus | undefined =
            scope === 'all' ? undefined : (scope as ProjectStatus);
        return {
            keyword: filters.keyword?.trim() || undefined,
            semesterId: filters.semesterId,
            tagId: filters.tagId,
            status,
            deadlineFrom: deadlineRange?.[0] ? deadlineRange[0].format('YYYY-MM-DD') : undefined,
            deadlineTo: deadlineRange?.[1] ? deadlineRange[1].format('YYYY-MM-DD') : undefined,
            includeAll: scope === 'all',
            page,
            size: PAGE_SIZE,
        };
    }, [filters, scope, deadlineRange, page]);

    const projects = useAsync(() => projectApi.list(query), [query]);

    const handleSearch = useCallback(
        (values: FilterForm) => {
            setFilters(values);
            setPage(1);
        },
        [],
    );

    const handleReset = useCallback(() => {
        form.resetFields();
        setFilters({});
        setScope(DEFAULT_SCOPE);
        setDeadlineRange(null);
        setPage(1);
    }, [form]);

    const handleScopeChange = (value: ScopeValue) => {
        setScope(value);
        setPage(1);
    };

    const items = projects.data?.items ?? [];
    const meta = projects.data?.page;

    const renderListItem = (project: Project) => {
        const deadline = formatDeadline(project.deadline, project.status);
        return (
            <List.Item key={project.id} style={{padding: 0, border: 'none', marginBottom: 12}}>
                <Card
                    hoverable
                    style={{width: '100%'}}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    styles={{body: {padding: isMobile ? 14 : 20}}}
                >
                    <Space direction="vertical" size={6} style={{width: '100%'}}>
                        <Flex justify="space-between" align="flex-start" gap={8} wrap>
                            <Typography.Text strong style={{fontSize: 16}}>
                                {project.name}
                            </Typography.Text>
                            <ProjectStatusTag status={project.status} label={project.statusName}/>
                        </Flex>

                        {project.description ? (
                            <Typography.Text type="secondary" style={{fontSize: 13}}>
                                {truncate(project.description, isMobile ? 40 : 80)}
                            </Typography.Text>
                        ) : (
                            <Typography.Text type="secondary" style={{fontSize: 13}}>
                                暂无项目描述
                            </Typography.Text>
                        )}

                        <Space size={4} wrap>
                            {project.semesters.map((semester) => (
                                <Tag key={`s-${semester.id}`} color="blue">
                                    {semester.name}
                                </Tag>
                            ))}
                            {project.tags.map((tag) => (
                                <Tag key={`t-${tag.id}`}>{tag.name}</Tag>
                            ))}
                            {project.mine ? <Tag color="green">已参与</Tag> : null}
                        </Space>

                        <Space direction="vertical" size={4} style={{width: '100%'}}>
                            {project.assignments.map((assignment) => (
                                <Flex key={assignment.id} align="center" gap={8} wrap>
                                    <Typography.Text style={{fontSize: 13}}>
                                        {assignment.name}
                                        {assignment.mine ? (
                                            <Tag color="green" style={{marginInlineStart: 6}}>
                                                我的
                                            </Tag>
                                        ) : null}
                                    </Typography.Text>
                                    <AssignmentCapacity
                                        assignment={assignment}
                                        style={{width: 'auto'}}
                                    />
                                </Flex>
                            ))}
                        </Space>

                        <Flex justify="space-between" align="center" wrap gap={8}>
                            <Typography.Text type={deadline.overdue ? 'danger' : 'secondary'} style={{fontSize: 12}}>
                                截止：{deadline.text}
                            </Typography.Text>
                            <Space size={12}>
                                <Typography.Text type="secondary" style={{fontSize: 12}}>
                                    {project.discussionCount} 条讨论
                                </Typography.Text>
                                <Typography.Text type="secondary" style={{fontSize: 12}}>
                                    已申领 {project.totalClaimed}/{project.totalCapacity}
                                </Typography.Text>
                            </Space>
                        </Flex>
                    </Space>
                </Card>
            </List.Item>
        );
    };

    return (
        <Space direction="vertical" size={16} style={{width: '100%'}}>
            <div className="ews-toolbar">
                <Form<FilterForm> form={form} layout="vertical" onFinish={handleSearch}>
                    <Row gutter={[12, 0]}>
                        <Col xs={24} sm={24} md={8}>
                            <Form.Item name="keyword" style={{marginBottom: 8}}>
                                <Input
                                    allowClear
                                    prefix={<SearchOutlined/>}
                                    placeholder="搜索项目名称、描述、分工、标签"
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={12} sm={12} md={5}>
                            <Form.Item name="semesterId" style={{marginBottom: 8}}>
                                <Select
                                    allowClear
                                    placeholder="学期"
                                    options={(semesters.data?.items ?? []).map((item) => ({
                                        value: item.id,
                                        label: item.name,
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={12} sm={12} md={5}>
                            <Form.Item name="tagId" style={{marginBottom: 8}}>
                                <Select
                                    allowClear
                                    placeholder="项目标签"
                                    options={(tags.data?.items ?? []).map((item) => ({
                                        value: item.id,
                                        label: item.name,
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <DatePicker.RangePicker
                                style={{width: '100%', marginBottom: 8}}
                                placeholder={['截止时间从', '截止时间至']}
                                value={deadlineRange}
                                onChange={(value) => {
                                    setDeadlineRange(value as [Dayjs, Dayjs] | null);
                                    setPage(1);
                                }}
                            />
                        </Col>
                    </Row>
                    <Space wrap>
                        <Button type="primary" htmlType="submit" icon={<SearchOutlined/>}>
                            搜索
                        </Button>
                        <Button icon={<ReloadOutlined/>} onClick={handleReset}>
                            重置
                        </Button>
                        <Button
                            icon={<FilterOutlined/>}
                            type="text"
                            onClick={() => projects.reload()}
                            loading={projects.loading}
                        >
                            刷新
                        </Button>
                    </Space>
                </Form>
            </div>

            <div className="ews-toolbar">
                <Segmented<ScopeValue>
                    value={scope}
                    options={SCOPE_OPTIONS}
                    onChange={handleScopeChange}
                    size={isMobile ? 'small' : 'middle'}
                />
            </div>

            {projects.loading && !projects.data ? (
                <LoadingBlock rows={5}/>
            ) : projects.error ? (
                <ErrorBlock error={projects.error} onRetry={projects.reload}/>
            ) : items.length === 0 ? (
                <div className="ews-card" style={{padding: '32px 16px'}}>
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="暂无数据"

                    />
                </div>
            ) : (
                <List
                    dataSource={items}
                    renderItem={renderListItem}
                    loading={projects.loading}
                    split={false}
                />
            )}

            {meta ? (
                <PagePager page={meta} simple={isMobile} onChange={setPage}/>
            ) : null}
        </Space>
    );
}
