import {Tag} from 'antd';

import type {ProjectStatus} from '@/types';
import {projectStatusMeta} from '@/utils/constants';

interface Props {
    status: ProjectStatus;
    label?: string;
}

export function ProjectStatusTag({status, label}: Props) {
    const meta = projectStatusMeta(status);
    return (
        <Tag color={meta.color} style={{marginInlineEnd: 0}}>
            {label || meta.label}
        </Tag>
    );
}
