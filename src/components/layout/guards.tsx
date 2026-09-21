import {Navigate, Outlet, useLocation} from 'react-router-dom';
import {Button, Result, Spin} from 'antd';

import {canManage, useAuthStore} from '@/stores/authStore';
import {isRedirectablePath, loginUrlWithRedirect} from '@/utils/redirect';

export function FullPageLoading() {
    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Spin size="large" tip="加载中…">
                <div style={{padding: 24}}/>
            </Spin>
        </div>
    );
}

export function RequireAuth() {
    const user = useAuthStore((state) => state.user);
    const initialized = useAuthStore((state) => state.initialized);
    const location = useLocation();

    if (!initialized) return <FullPageLoading/>;
    if (!user) {
        const target = location.pathname + location.search;
        const loginPath = isRedirectablePath(location.pathname)
            ? loginUrlWithRedirect(target)
            : '/login';
        return <Navigate to={loginPath} replace/>;
    }
    return <Outlet/>;
}

export function RequirePasswordChanged() {
    const user = useAuthStore((state) => state.user);
    if (user?.mustChangePassword) {
        return <Navigate to="/password" replace/>;
    }
    return <Outlet/>;
}

export function RequireAdmin() {
    const user = useAuthStore((state) => state.user);
    if (!canManage(user?.role)) {
        return (
            <Result
                status="403"
                title="403"
                subTitle="无管理员权限"
                extra={
                    <Button type="primary" href="/projects">
                        返回项目列表
                    </Button>
                }
            />
        );
    }
    return <Outlet/>;
}
