import {useCallback, useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ReloadOutlined, SearchOutlined} from '@ant-design/icons';
import {Button, Card, Empty, Flex, Input, List, Popconfirm, Space, Tag, Typography,} from 'antd';

import {projectApi} from '@/api/project';
import {ApiError} from '@/api/error';
import {PagePager} from '@/components/common/PagePager';
import {ErrorBlock, LoadingBlock} from '@/components/common/StateBlocks';
import {ProjectStatusTag} from '@/components/common/ProjectStatusTag';
import {useAsync} from '@/hooks/useAsync';
import {useIsMobile} from '@/hooks/useIsMobile';
import type {MyTask} from '@/types';
import {PAGE_SIZE} from '@/utils/constants';
import {getStaticApi} from '@/utils/antdStatic';
import {formatDeadline, formatFromNow} from '@/utils/format';

export function MyTasksPage() {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const [page, setPage] = useState(1);
    const [keyword, setKeyword] = useState('');
    const [searchKey, setSearchKey] = useState('');
    const [cancelingId, setCancelingId] = useState<number | null>(null);

    const query = useMemo(
        () => ({keyword: searchKey || undefined, page, size: PAGE_SIZE}),
        [searchKey, page],
    );
    const tasks = useAsync(() => projectApi.myTasks(query), [query], {toastOnError: false});

    const handleCancel = useCallback(
        async (task: MyTask) => {
            setCancelingId(task.assignmentId);
            try {
                await projectApi.cancelClaim(task.assignmentId);
                getStaticApi()?.message.success(`已取消申领「${task.assignmentName}」`);
                tasks.reload();
            } catch (error) {
                const message = error instanceof ApiError ? error.message : '取消失败';
                getStaticApi()?.message.error(message);
            } finally {
                setCancelingId(null);
            }
        },
        [tasks],
    );

    const items = tasks.data?.items ?? [];
    const meta = tasks.data?.page;

    return (
        <Space direction="vertical" size={16} style={{width: '100%'}}>
            <div className="ews-toolbar">
                <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%'}}>
                    <Input
                        allowClear
                        value={keyword}
                        onChange={(event) => setKeyword(event.target.value)}
                        onPressEnter={() => {
                            setSearchKey(keyword.trim());
                            setPage(1);
                        }}
                        prefix={<SearchOutlined/>}
                        placeholder="搜索项目名称或分工名称"
                        style={{flex: 1, minWidth: 200}}
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
                    <Button icon={<ReloadOutlined/>} onClick={() => tasks.reload()} loading={tasks.loading}>
                        刷新
                    </Button>
                </div>
            </div>

            {tasks.loading && !tasks.data ? (
                <LoadingBlock rows={4}/>
            ) : tasks.error ? (
                <ErrorBlock error={tasks.error} onRetry={tasks.reload}/>
            ) : items.length === 0 ? (
                <div className="ews-card" style={{padding: '32px 16px'}}>
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="暂无数据"
                    >
                        <Button type="primary" onClick={() => navigate('/projects')}>
                            去看看项目
                        </Button>
                    </Empty>
                </div>
            ) : (
                <List
                    dataSource={items}
                    loading={tasks.loading}
                    renderItem={(task) => {
                        const deadline = formatDeadline(task.deadline, task.projectStatus);
                        return (
                            <List.Item
                                key={`${task.projectId}-${task.assignmentId}`}
                                style={{padding: 0, border: 'none', marginBottom: 12}}
                            >
                                <Card
                                    style={{width: '100%'}}
                                    styles={{body: {padding: isMobile ? 14 : 18}}}
                                    hoverable
                                    onClick={() => navigate(`/projects/${task.projectId}`)}
                                >
                                    <Space direction="vertical" size={8} style={{width: '100%'}}>
                                        <Flex justify="space-between" align="flex-start" wrap gap={8}>
                                            <Typography.Text strong style={{fontSize: 16}}>
                                                {task.projectName}
                                            </Typography.Text>
                                            <ProjectStatusTag status={task.projectStatus}/>
                                        </Flex>

                                        <Space size={4} wrap>
                                            <Tag color="blue">{task.assignmentName}</Tag>
                                            {task.assigned ? <Tag color="purple">管理员指派</Tag> : <Tag>自主申领</Tag>}
                                        </Space>

                                        <Flex justify="space-between" align="center" wrap gap={8}>
                                            <Typography.Text
                                                type={deadline.overdue ? 'danger' : 'secondary'}
                                                style={{fontSize: 12}}
                                            >
                                                截止：{deadline.text}
                                            </Typography.Text>
                                            <Typography.Text type="secondary" style={{fontSize: 12}}>
                                                申领于 {formatFromNow(task.claimedAt)}
                                            </Typography.Text>
                                        </Flex>

                                        <Flex justify="flex-end" onClick={(event) => event.stopPropagation()}>
                                            <Popconfirm
                                                title="确认取消这条申领？"
                                                description="取消后名额将被释放，且申领信息不可修改。"
                                                okText="确认取消"
                                                cancelText="再想想"
                                                onConfirm={() => handleCancel(task)}
                                            >
                                                <Button
                                                    type="link"
                                                    size="small"
                                                    danger
                                                    loading={cancelingId === task.assignmentId}
                                                >
                                                    取消申领
                                                </Button>
                                            </Popconfirm>
                                        </Flex>
                                    </Space>
                                </Card>
                            </List.Item>
                        );
                    }}
                />
            )}

            {meta ? <PagePager page={meta} simple={isMobile} onChange={setPage}/> : null}
        </Space>
    );
}
