import {useMemo, useState} from 'react';
import {ReloadOutlined} from '@ant-design/icons';
import {Button, Card, Empty, Flex, List, Select, Space, Tag, Typography} from 'antd';

import {tagApi} from '@/api/tag';
import {workloadApi} from '@/api/workload';
import {ErrorBlock, LoadingBlock} from '@/components/common/StateBlocks';
import {useAsync} from '@/hooks/useAsync';
import {useIsMobile} from '@/hooks/useIsMobile';
import {useAuthStore} from '@/stores/authStore';

export function WorkloadPage() {
    const user = useAuthStore((state) => state.user);
    const isMobile = useIsMobile();
    const [semesterIds, setSemesterIds] = useState<number[]>([]);

    const semesters = useAsync(() => tagApi.listSemesters(), []);
    const ranking = useAsync(() => workloadApi.ranking(semesterIds), [semesterIds], {
        toastOnError: false,
    });

    const options = useMemo(
        () => (semesters.data?.items ?? []).map((semester) => ({label: semester.name, value: semester.id})),
        [semesters.data],
    );

    const items = ranking.data?.items ?? [];

    return (
        <Space direction="vertical" size={16} style={{width: '100%'}}>
            <div className="ews-toolbar">
                <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%'}}>
                    <Select
                        mode="multiple"
                        allowClear
                        value={semesterIds}
                        onChange={setSemesterIds}
                        options={options}
                        loading={semesters.loading}
                        placeholder="选择统计学期"
                        maxTagCount="responsive"
                        style={{flex: 1, minWidth: 220}}
                    />
                    <Button icon={<ReloadOutlined/>} onClick={ranking.reload} loading={ranking.loading}>
                        刷新
                    </Button>
                </div>
            </div>

            <Card>
                {ranking.loading && !ranking.data ? (
                    <LoadingBlock rows={5}/>
                ) : ranking.error ? (
                    <ErrorBlock error={ranking.error} onRetry={ranking.reload}/>
                ) : items.length === 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据"/>
                ) : (
                    <List
                        dataSource={items}
                        loading={ranking.loading}
                        renderItem={(item, index) => {
                            const rank = index + 1;
                            const mine = item.studentId === user?.studentId;
                            const rankColor =
                                rank === 1 ? 'gold' : rank === 2 ? 'blue' : rank === 3 ? 'orange' : 'default';
                            return (
                                <List.Item key={item.studentId} style={{padding: '10px 0'}}>
                                    <Flex align="center" justify="space-between" gap={12}
                                          style={{width: '100%'}}>
                                        <Flex align="center" gap={12} style={{minWidth: 0}}>
                                            <Tag color={rankColor} style={{minWidth: 34, textAlign: 'center'}}>
                                                {rank}
                                            </Tag>
                                            <Space size={6} wrap>
                                                <Typography.Text strong>
                                                    {item.studentName || item.studentId}
                                                </Typography.Text>
                                                {mine ? <Tag color="green">我</Tag> : null}
                                                {isMobile ? null : (
                                                    <Typography.Text type="secondary" style={{fontSize: 12}}>
                                                        {item.studentId}
                                                    </Typography.Text>
                                                )}
                                            </Space>
                                        </Flex>
                                        <Typography.Text strong style={{fontSize: 16}}>
                                            {item.workload}
                                        </Typography.Text>
                                    </Flex>
                                </List.Item>
                            );
                        }}
                    />
                )}
            </Card>
        </Space>
    );
}
