import {useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Calendar, Card, Empty, Flex, List, Space, Tag, Typography} from 'antd';
import type {CalendarMode} from 'antd/es/calendar';
import type {Dayjs} from 'dayjs';
import dayjs from 'dayjs';

import {projectApi} from '@/api/project';
import {ErrorBlock, LoadingBlock} from '@/components/common/StateBlocks';
import {ProjectStatusTag} from '@/components/common/ProjectStatusTag';
import {useAsync} from '@/hooks/useAsync';
import {useIsMobile} from '@/hooks/useIsMobile';
import type {Project} from '@/types';
import {formatDateTime} from '@/utils/format';

const CALENDAR_SIZE = 100;

const MAX_CELL_ITEMS = 2;

export function CalendarPage() {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
    const [mode, setMode] = useState<CalendarMode>('month');

    const projects = useAsync(
        () => projectApi.list({includeAll: true, page: 1, size: CALENDAR_SIZE}),
        [],
    );

    const groupedByDay = useMemo(() => {
        const map = new Map<string, Project[]>();
        for (const project of projects.data?.items ?? []) {
            const key = dayjs(project.deadline).format('YYYY-MM-DD');
            const list = map.get(key) ?? [];
            list.push(project);
            map.set(key, list);
        }
        return map;
    }, [projects.data]);

    const groupedByMonth = useMemo(() => {
        const map = new Map<string, Project[]>();
        for (const project of projects.data?.items ?? []) {
            const key = dayjs(project.deadline).format('YYYY-MM');
            const list = map.get(key) ?? [];
            list.push(project);
            map.set(key, list);
        }
        return map;
    }, [projects.data]);

    const isYearMode = mode === 'year';
    const selectedDayKey = selectedDate.format('YYYY-MM-DD');
    const selectedMonthKey = selectedDate.format('YYYY-MM');
    const selectedProjects = isYearMode
        ? groupedByMonth.get(selectedMonthKey) ?? []
        : groupedByDay.get(selectedDayKey) ?? [];

    const renderCellItems = (list: Project[]) => {
        if (list.length === 0) return null;
        const shown = list.slice(0, MAX_CELL_ITEMS);
        return (
            <Flex vertical gap={2} style={{marginTop: 2}}>
                {shown.map((project) => (
                    <Tag
                        key={project.id}
                        color={project.status === 'active' ? 'blue' : 'default'}
                        style={{
                            marginInlineEnd: 0,
                            fontSize: 11,
                            lineHeight: '16px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {project.name}
                    </Tag>
                ))}
                {list.length > MAX_CELL_ITEMS ? (
                    <Typography.Text type="secondary" style={{fontSize: 11}}>
                        还有 {list.length - MAX_CELL_ITEMS} 项
                    </Typography.Text>
                ) : null}
            </Flex>
        );
    };

    if (projects.loading && !projects.data) return <LoadingBlock rows={6}/>;
    if (projects.error) return <ErrorBlock error={projects.error} onRetry={projects.reload}/>;

    return (
        <Space direction="vertical" size={16} style={{width: '100%'}}>
            <Card styles={{body: {padding: isMobile ? 8 : 16}}}>
                <Calendar
                    value={selectedDate}
                    onSelect={(date) => {
                        setSelectedDate(date);
                    }}
                    onPanelChange={(date, nextMode) => {
                        setSelectedDate((previous) => {
                            if (nextMode === 'year') return date;
                            return previous.year() === date.year() && previous.month() === date.month()
                                ? previous
                                : date;
                        });
                        setMode(nextMode);
                    }}
                    cellRender={(date, info) => {
                        if (info.type === 'month') return renderCellItems(groupedByMonth.get(date.format('YYYY-MM')) ?? []);
                        if (info.type === 'date') return renderCellItems(groupedByDay.get(date.format('YYYY-MM-DD')) ?? []);
                        return info.originNode;
                    }}
                />
            </Card>

            <Card
                title={
                    isYearMode
                        ? `${selectedMonthKey} 截止的项目（${selectedProjects.length}）`
                        : `${selectedDayKey} 截止的项目（${selectedProjects.length}）`
                }
            >
                {selectedProjects.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="暂无数据"
                    />
                ) : (
                    <List
                        dataSource={selectedProjects}
                        renderItem={(project) => (
                            <List.Item
                                key={project.id}
                                style={{cursor: 'pointer'}}
                                onClick={() => {
                                    navigate(`/projects/${project.id}`);
                                }}
                            >
                                <List.Item.Meta
                                    title={
                                        <Space size={8} wrap>
                                            <Typography.Text strong>{project.name}</Typography.Text>
                                            <ProjectStatusTag status={project.status} label={project.statusName}/>
                                        </Space>
                                    }
                                    description={
                                        <Space size={8} wrap>
                                            <Typography.Text type="secondary" style={{fontSize: 12}}>
                                                截止 {formatDateTime(project.deadline)}
                                            </Typography.Text>
                                            <Typography.Text type="secondary" style={{fontSize: 12}}>
                                                已申领 {project.totalClaimed}/{project.totalCapacity}
                                            </Typography.Text>
                                        </Space>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                )}
            </Card>
        </Space>
    );
}
