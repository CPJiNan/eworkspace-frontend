import {Alert, Button, Skeleton, Space} from 'antd';

import type {ApiError} from '@/api/error';

interface LoadingProps {
    rows?: number;
}

export function LoadingBlock({rows = 4}: LoadingProps) {
    return <Skeleton active paragraph={{rows}}/>;
}

interface ErrorProps {
    error: ApiError;
    onRetry?: () => void;
}

export function ErrorBlock({error, onRetry}: ErrorProps) {
    return (
        <Alert
            type="error"
            showIcon
            message="加载失败"
            description={error.message}
            action={
                onRetry ? (
                    <Space>
                        <Button size="small" onClick={onRetry}>
                            重试
                        </Button>
                    </Space>
                ) : null
            }
        />
    );
}

