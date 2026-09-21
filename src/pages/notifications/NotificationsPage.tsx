import {useCallback, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {BellOutlined, CheckOutlined, DeleteOutlined} from '@ant-design/icons';
import {Badge, Button, Card, Checkbox, Empty, Flex, List, Popconfirm, Space, Tag, Typography,} from 'antd';

import {notificationApi} from '@/api/notification';
import {ApiError} from '@/api/error';
import {PagePager} from '@/components/common/PagePager';
import {ErrorBlock, LoadingBlock} from '@/components/common/StateBlocks';
import {useAsync} from '@/hooks/useAsync';
import {useIsMobile} from '@/hooks/useIsMobile';
import {useUnreadCount} from '@/hooks/useUnreadCount';
import type {Notification} from '@/types';
import {PAGE_SIZE} from '@/utils/constants';
import {getStaticApi} from '@/utils/antdStatic';
import {formatFromNow} from '@/utils/format';

export function NotificationsPage() {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const {refresh: refreshUnread} = useUnreadCount();

    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<number[]>([]);

    const notices = useAsync(() => notificationApi.list(page, PAGE_SIZE), [page]);
    const items = notices.data?.items ?? [];
    const meta = notices.data?.page;

    const afterMutate = useCallback(() => {
        setSelected([]);
        notices.reload();
        refreshUnread();
    }, [notices, refreshUnread]);

    const handleMarkRead = async (item: Notification) => {
        if (item.read) return;
        try {
            await notificationApi.markRead(item.id);
            afterMutate();
        } catch (error) {
            getStaticApi()?.message.error(error instanceof ApiError ? error.message : '操作失败');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationApi.markAllRead();
            getStaticApi()?.message.success('已全部标记为已读');
            afterMutate();
        } catch (error) {
            getStaticApi()?.message.error(error instanceof ApiError ? error.message : '操作失败');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await notificationApi.remove(id);
            getStaticApi()?.message.success('已删除');
            afterMutate();
        } catch (error) {
            getStaticApi()?.message.error(error instanceof ApiError ? error.message : '删除失败');
        }
    };

    const handleBatchDelete = async () => {
        if (selected.length === 0) {
            getStaticApi()?.message.warning('请先选择要删除的短信');
            return;
        }
        try {
            const result = await notificationApi.removeMany(selected);
            getStaticApi()?.message.success(`已删除 ${result.deleted} 条短信`);
            afterMutate();
        } catch (error) {
            getStaticApi()?.message.error(error instanceof ApiError ? error.message : '删除失败');
        }
    };

    const handleClear = async () => {
        try {
            const result = await notificationApi.clear();
            getStaticApi()?.message.success(`已清空 ${result.deleted} 条短信`);
            setPage(1);
            afterMutate();
        } catch (error) {
            getStaticApi()?.message.error(error instanceof ApiError ? error.message : '清空失败');
        }
    };

    const toggleSelect = (id: number, checked: boolean) => {
        setSelected((prev) => (checked ? [...prev, id] : prev.filter((item) => item !== id)));
    };

    const allSelected = items.length > 0 && selected.length === items.length;

    return (
        <Space direction="vertical" size={16} style={{width: '100%'}}>
            <div className="ews-toolbar">
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        flexWrap: 'wrap',
                    }}
                >
                    <Space size={8} wrap>
                        <BellOutlined/>
                        <Typography.Text strong>站内短信</Typography.Text>
                        {notices.data ? (
                            <Badge count={notices.data.unreadCount} size="small" overflowCount={99}>
                                <Tag color={notices.data.unreadCount > 0 ? 'red' : 'default'}>
                                    {notices.data.unreadCount > 0 ? '有未读' : '全部已读'}
                                </Tag>
                            </Badge>
                        ) : null}
                    </Space>

                    <Space size={8} wrap>
                        <Checkbox
                            checked={allSelected}
                            indeterminate={selected.length > 0 && !allSelected}
                            onChange={(event) =>
                                setSelected(event.target.checked ? items.map((item) => item.id) : [])
                            }
                        >
                            全选本页
                        </Checkbox>
                        <Button
                            icon={<CheckOutlined/>}
                            onClick={handleMarkAllRead}
                            disabled={!notices.data || notices.data.unreadCount === 0}
                        >
                            全部已读
                        </Button>
                        <Popconfirm
                            title={`确认删除选中的 ${selected.length} 条短信？`}
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
                        <Popconfirm
                            title="确认清空全部站内短信？"
                            okText="确认清空"
                            cancelText="取消"
                            okButtonProps={{danger: true}}
                            onConfirm={handleClear}
                        >
                            <Button danger>清空</Button>
                        </Popconfirm>
                    </Space>
                </div>
            </div>

            {notices.loading && !notices.data ? (
                <LoadingBlock rows={4}/>
            ) : notices.error ? (
                <ErrorBlock error={notices.error} onRetry={notices.reload}/>
            ) : items.length === 0 ? (
                <div className="ews-card" style={{padding: '32px 16px'}}>
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据"/>
                </div>
            ) : (
                <List
                    dataSource={items}
                    loading={notices.loading}
                    renderItem={(item) => (
                        <List.Item
                            key={item.id}
                            style={{padding: 0, border: 'none', marginBottom: 8}}
                        >
                            <Card
                                style={{width: '100%'}}
                                styles={{body: {padding: isMobile ? 12 : 16}}}
                            >
                                <Flex gap={12} align="flex-start">
                                    <Checkbox
                                        checked={selected.includes(item.id)}
                                        onChange={(event) => toggleSelect(item.id, event.target.checked)}
                                        style={{marginTop: 4}}
                                    />
                                    <div style={{flex: 1, minWidth: 0}}>
                                        <Flex justify="space-between" align="flex-start" gap={8} wrap>
                                            <Space size={6} wrap>
                                                {!item.read ? <Badge status="processing"/> : null}
                                                <Typography.Text strong={!item.read}>{item.title}</Typography.Text>
                                                {!item.read ? <Tag color="red">未读</Tag> : null}
                                            </Space>
                                            <Typography.Text type="secondary" style={{fontSize: 12}}>
                                                {formatFromNow(item.createdAt)}
                                            </Typography.Text>
                                        </Flex>

                                        {item.content ? (
                                            <Typography.Paragraph
                                                type="secondary"
                                                className="preserve-linebreak"
                                                style={{fontSize: 13, marginTop: 4, marginBottom: 8}}
                                            >
                                                {item.content}
                                            </Typography.Paragraph>
                                        ) : null}

                                        <Space size={8} wrap>
                                            {item.projectId ? (
                                                <Button
                                                    type="link"
                                                    size="small"
                                                    style={{paddingInline: 0}}
                                                    onClick={() => navigate(`/projects/${item.projectId}`)}
                                                >
                                                    查看项目
                                                </Button>
                                            ) : null}
                                            {!item.read ? (
                                                <Button type="link" size="small" onClick={() => handleMarkRead(item)}>
                                                    标记已读
                                                </Button>
                                            ) : null}
                                            <Popconfirm
                                                title="确认删除这条短信？"
                                                okText="删除"
                                                cancelText="取消"
                                                okButtonProps={{danger: true}}
                                                onConfirm={() => handleDelete(item.id)}
                                            >
                                                <Button type="link" size="small" danger>
                                                    删除
                                                </Button>
                                            </Popconfirm>
                                        </Space>
                                    </div>
                                </Flex>
                            </Card>
                        </List.Item>
                    )}
                />
            )}

            {meta ? (
                <PagePager page={meta} simple={isMobile} onChange={setPage}/>
            ) : null}
        </Space>
    );
}
