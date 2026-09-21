import {Tag} from 'antd';

import type {ProjectStatus} from '@/types';
import {PROJECT_STATUS_META} from '@/utils/constants';

interface Props {
    status: ProjectStatus;
    label?: string;
}

export function ProjectStatusTag({status, label}: Props) {
    const meta = PROJECT_STATUS_META[status] ?? {label: '未知', color: 'default'};
    return (
        <Tag color={meta.color} style={{marginInlineEnd: 0}}>
            {label || meta.label}
        </Tag>
    );
}
