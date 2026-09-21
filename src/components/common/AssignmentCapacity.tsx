import type {CSSProperties} from 'react';
import {Progress, Space, Tag, Typography} from 'antd';

import type {Assignment} from '@/types';
import {capacityText} from '@/utils/format';

interface Props {
    assignment: Pick<Assignment, 'claimedCount' | 'capacity' | 'full' | 'remaining'>;
    showProgress?: boolean;
    style?: CSSProperties;
}

export function AssignmentCapacity({assignment, showProgress = false, style}: Props) {
    const {claimedCount, capacity, full, remaining} = assignment;
    const percent = capacity > 0 ? Math.round((claimedCount / capacity) * 100) : 0;

    return (
        <Space direction="vertical" size={2} style={style ?? {width: '100%'}}>
            <Space size={6} wrap>
                <Typography.Text strong>{capacityText(claimedCount, capacity)}</Typography.Text>
                {full ? (
                    <Tag color="red" style={{marginInlineEnd: 0}}>
                        名额已满
                    </Tag>
                ) : (
                    <Tag color="green" style={{marginInlineEnd: 0}}>
                        剩余 {remaining}
                    </Tag>
                )}
            </Space>
            {showProgress ? (
                <Progress
                    percent={percent}
                    size="small"
                    showInfo={false}
                    status={full ? 'exception' : 'active'}
                />
            ) : null}
        </Space>
    );
}
