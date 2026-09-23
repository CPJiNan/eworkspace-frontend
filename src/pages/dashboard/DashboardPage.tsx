import {useMemo, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {
    BellOutlined,
    CalendarOutlined,
    CarryOutOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    FileSearchOutlined,
    NotificationOutlined,
    PlusOutlined,
    ReloadOutlined,
    RiseOutlined,
    SafetyOutlined,
    TeamOutlined,
    TrophyOutlined,
    UserAddOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import {Button, Col, Empty, Row, Space, Tag, Tooltip, Typography} from 'antd';

import {ActionRow, Panel, StatCard} from '@/components/common/Panel';
import {ErrorBlock, LoadingBlock} from '@/components/common/StateBlocks';
import {ProjectStatusTag} from '@/components/common/ProjectStatusTag';
import {useAsync} from '@/hooks/useAsync';
import {canManage, useAuthStore} from '@/stores/authStore';
import {loadDashboard} from '@/services/dashboard';
import {formatDateTime, formatDeadline, formatFromNow} from '@/utils/format';

export function DashboardPage() {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const [refreshKey, setRefreshKey] = useState(0);

    const isAdmin = canManage(user?.role);

    const dashboard = useAsync(
        () => (user ? loadDashboard(user) : Promise.resolve(undefined)),
        [user?.studentId, refreshKey],
        {enabled: Boolean(user)},
    );

    const data = dashboard.data;
    const stats = data?.stats;

    const cards = useMemo(() => {
        if (!stats) return [];

        const base = [
            {
                key: 'active',
                label: '进行中项目',
                value: stats.activeProjects,
                icon: <RiseOutlined/>,
                tone: 'blue' as const,
                onClick: () => {
                    navigate('/projects');
                },
            },
            {
                key: 'seats',
                label: '项目名额',
                value: `${stats.claimedSeats}/${stats.totalSeats}`,
                icon: <CheckCircleOutlined/>,
                tone: 'green' as const,
            },
            {
                key: 'myTasks',
                label: '我的任务',
                value: stats.myTasks,
                icon: <CarryOutOutlined/>,
                tone: 'purple' as const,
                onClick: () => {
                    navigate('/my/tasks');
                },
            },
            {
                key: 'unread',
                label: '未读短信',
                value: stats.unreadNotifications,
                icon: <BellOutlined/>,
                tone: 'orange' as const,
                onClick: () => {
                    navigate('/notifications');
                },
            },
            {
                key: 'nextDeadline',
                label: '最近截止',
                value: stats.nextDeadline ? formatDateTime(stats.nextDeadline).slice(5, 16) : '-',
                icon: <ClockCircleOutlined/>,
                tone: 'cyan' as const,
            },
            {
                key: 'workload',
                label: '工作量',
                value: stats.myWorkload,
                icon: <TrophyOutlined/>,
                tone: 'red' as const,
                onClick: () => {
                    navigate('/workload');
                },
            },
        ];

        if (!isAdmin) return base;

        return [
            ...base,
            {
                key: 'members',
                label: '成员总数',
                value: stats.totalMembers ?? '-',
                icon: <TeamOutlined/>,
                tone: 'blue' as const,
                onClick: () => {
                    navigate('/admin/members');
                },
            },
            {
                key: 'logs',
                label: '操作日志',
                value: stats.totalLogs ?? '-',
                icon: <FileSearchOutlined/>,
                tone: 'green' as const,
                onClick: () => {
                    navigate('/admin/logs');
                },
            },
        ];
    }, [stats, isAdmin, navigate]);

    if (dashboard.loading && !data) return <LoadingBlock rows={6}/>;
    if (dashboard.error) return <ErrorBlock error={dashboard.error} onRetry={dashboard.reload}/>;
    if (!data || !stats) return null;

    return (
        <>
            <div className="ews-notice">
                <NotificationOutlined style={{color: 'var(--ews-text-muted)'}}/>
                <Typography.Text style={{fontSize: 13}}>
                    暂无公告。
                </Typography.Text>
                {stats.overdueTasks > 0 ? (
                    <Tag color="error" style={{marginInlineStart: 'auto'}}>
                        <WarningOutlined/> {stats.overdueTasks} 项任务已逾期
                    </Tag>
                ) : null}
            </div>

            <Row gutter={[16, 16]}>
                {cards.map((card) => (
                    <Col key={card.key} xs={12} sm={12} md={8} lg={6} xl={isAdmin ? 6 : 4}>
                        <StatCard
                            label={card.label}
                            value={card.value}
                            icon={card.icon}
                            tone={card.tone}
                            onClick={card.onClick}
                        />
                    </Col>
                ))}
            </Row>

            {data.partial ? (
                <div className="ews-toolbar">
                    <Tag color="warning">数据加载失败</Tag>
                </div>
            ) : null}

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={14}>
                    <Panel
                        title="最近发布的项目"
                        extra={
                            <Space size={4}>
                                <Tooltip title="重新拉取统计数据">
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<ReloadOutlined/>}
                                        loading={dashboard.loading}
                                        onClick={() => {
                                            setRefreshKey((value) => value + 1);
                                            dashboard.reload();
                                        }}
                                    />
                                </Tooltip>
                            </Space>
                        }
                        tight
                    >
                        {data.recentProjects.length === 0 ? (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据"/>
                        ) : (
                            <div>
                                {data.recentProjects.map((project) => {
                                    const deadline = formatDeadline(project.deadline, project.status);
                                    return (
                                        <button
                                            key={project.id}
                                            type="button"
                                            className="ews-action"
                                            onClick={() => {
                                                navigate(`/projects/${project.id}`);
                                            }}
                                        >
                                            <div style={{flex: 1, minWidth: 0}}>
                                                <Space size={6} wrap>
                                                    <span className="ews-action__title">{project.name}</span>
                                                    <ProjectStatusTag status={project.status}
                                                                      label={project.statusName}/>
                                                    {project.mine ? <Tag color="green">已参与</Tag> : null}
                                                </Space>
                                                <div className="ews-action__desc">
                                                    {formatDateTime(project.createdAt)} 发布 ·
                                                    已申领 {project.totalClaimed}/
                                                    {project.totalCapacity} · 截止 {deadline.text}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </Panel>

                    <Panel
                        title="即将截止"
                        style={{marginTop: 'var(--ews-gap)'}}
                        extra={
                            <Link to="/projects">
                                <Button type="link" size="small" style={{paddingInline: 0}}>
                                    查看全部
                                </Button>
                            </Link>
                        }
                        tight
                    >
                        {data.upcomingProjects.length === 0 ? (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据"/>
                        ) : (
                            <div>
                                {data.upcomingProjects.map((project) => {
                                    const deadline = formatDeadline(project.deadline, project.status);
                                    return (
                                        <button
                                            key={project.id}
                                            type="button"
                                            className="ews-action"
                                            onClick={() => {
                                                navigate(`/projects/${project.id}`);
                                            }}
                                        >
                                            <CalendarOutlined style={{color: 'var(--ews-text-muted)'}}/>
                                            <div style={{flex: 1, minWidth: 0}}>
                                                <div className="ews-action__title">{project.name}</div>
                                                <div
                                                    className="ews-action__desc"
                                                    style={{color: deadline.overdue ? 'var(--ews-tone-red-fg)' : undefined}}
                                                >
                                                    {deadline.text}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </Panel>
                </Col>

                <Col xs={24} lg={10}>
                    <Panel title="快捷操作" tight>
                        <div style={{padding: '2px 0'}}>
                            {isAdmin ? (
                                <>
                                    <ActionRow
                                        icon={<PlusOutlined/>}
                                        title="发布项目"
                                        onClick={() => {
                                            navigate('/admin/projects/new');
                                        }}
                                    />
                                    <ActionRow
                                        icon={<UserAddOutlined/>}
                                        title="新增账号"
                                        onClick={() => {
                                            navigate('/admin/members');
                                        }}
                                    />
                                    <ActionRow
                                        icon={<FileSearchOutlined/>}
                                        title="操作日志"
                                        onClick={() => {
                                            navigate('/admin/logs');
                                        }}
                                    />
                                </>
                            ) : (
                                <>
                                    <ActionRow
                                        icon={<RiseOutlined/>}
                                        title="申领分工"
                                        onClick={() => {
                                            navigate('/projects');
                                        }}
                                    />
                                    <ActionRow
                                        icon={<CarryOutOutlined/>}
                                        title="我的任务"
                                        onClick={() => {
                                            navigate('/my/tasks');
                                        }}
                                    />
                                    <ActionRow
                                        icon={<SafetyOutlined/>}
                                        title="个人信息"
                                        onClick={() => {
                                            navigate('/profile');
                                        }}
                                    />
                                </>
                            )}
                        </div>
                    </Panel>

                    <Panel
                        title="我的任务"
                        style={{marginTop: 'var(--ews-gap)'}}
                        extra={
                            <Link to="/my/tasks">
                                <Button type="link" size="small" style={{paddingInline: 0}}>
                                    查看全部
                                </Button>
                            </Link>
                        }
                        tight
                    >
                        {data.myTasks.length === 0 ? (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据">
                                <Button type="primary" onClick={() => {
                                    navigate('/projects');
                                }}>
                                    去看看项目
                                </Button>
                            </Empty>
                        ) : (
                            <div>
                                {data.myTasks.map((task) => {
                                    const deadline = formatDeadline(task.deadline, task.projectStatus);
                                    return (
                                        <button
                                            key={`${task.projectId}-${task.assignmentName}`}
                                            type="button"
                                            className="ews-action"
                                            onClick={() => {
                                                navigate(`/projects/${task.projectId}`);
                                            }}
                                        >
                                            <div style={{flex: 1, minWidth: 0}}>
                                                <Space size={6} wrap>
                                                    <span className="ews-action__title">{task.assignmentName}</span>
                                                    <Tag>{task.projectName}</Tag>
                                                </Space>
                                                <div
                                                    className="ews-action__desc"
                                                    style={{color: deadline.overdue ? 'var(--ews-tone-red-fg)' : undefined}}
                                                >
                                                    截止 {deadline.text}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </Panel>

                    <Panel
                        title="最新站内短信"
                        style={{marginTop: 'var(--ews-gap)'}}
                        extra={
                            <Link to="/notifications">
                                <Button type="link" size="small" style={{paddingInline: 0}}>
                                    查看全部
                                </Button>
                            </Link>
                        }
                        tight
                    >
                        {data.recentNotifications.length === 0 ? (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据"/>
                        ) : (
                            <div>
                                {data.recentNotifications.slice(0, 4).map((notice) => (
                                    <button
                                        key={notice.id}
                                        type="button"
                                        className="ews-action"
                                        onClick={() => {
                                            navigate(notice.projectId ? `/projects/${notice.projectId}` : '/notifications');
                                        }}
                                    >
                                        <div style={{flex: 1, minWidth: 0}}>
                                            <Space size={6} wrap>
                                                {!notice.read ? <Tag color="red">未读</Tag> : null}
                                                <span className="ews-action__title">{notice.title}</span>
                                            </Space>
                                            <div className="ews-action__desc">{formatFromNow(notice.createdAt)}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </Panel>
                </Col>
            </Row>
        </>
    );
}
