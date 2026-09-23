import {Component, type ErrorInfo, type ReactNode} from 'react';
import {Button, Result, Typography} from 'antd';

interface Props {
    children: ReactNode;
}

interface State {
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = {error: null};

    static getDerivedStateFromError(error: Error): State {
        return {error};
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        console.error('页面渲染异常', error, info.componentStack);
    }

    render() {
        const {error} = this.state;
        if (!error) return this.props.children;

        return (
            <Result
                status="error"
                title="页面渲染异常"
                subTitle="请尝试刷新页面。"
                extra={
                    <Button type="primary" onClick={this.handleReset}>
                        返回首页
                    </Button>
                }
            >
                <Typography.Paragraph type="secondary" style={{fontSize: 12}}>
                    {error.message}
                </Typography.Paragraph>
            </Result>
        );
    }

    private handleReset = () => {
        this.setState({error: null});
        window.location.assign('/projects');
    };
}
