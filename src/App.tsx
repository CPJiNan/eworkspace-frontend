import {useEffect, useMemo} from 'react';
import {RouterProvider} from 'react-router-dom';
import {App as AntdApp, ConfigProvider, theme as antdTheme} from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

import {router} from '@/router';
import {ErrorBoundary} from '@/components/common/ErrorBoundary';
import {useAuthStore} from '@/stores/authStore';
import {useUiStore} from '@/stores/uiStore';
import {bindStaticApi} from '@/utils/antdStatic';

dayjs.locale('zh-cn');

function StaticApiBinder() {
    const {message, notification, modal} = AntdApp.useApp();

    useEffect(() => {
        bindStaticApi({message, notification, modal});
    }, [message, notification, modal]);

    return null;
}

export default function App() {
    const themeMode = useUiStore((state) => state.theme);
    const bootstrap = useAuthStore((state) => state.bootstrap);
    const refreshUser = useAuthStore((state) => state.refreshUser);

    useEffect(() => {
        bootstrap();
        if (useAuthStore.getState().user) {
            void refreshUser().catch(() => {
            });
        }
    }, [bootstrap, refreshUser]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', themeMode);
        document.documentElement.style.colorScheme = themeMode;
    }, [themeMode]);

    const themeConfig = useMemo(
        () => ({
            algorithm: themeMode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
            token: {
                colorPrimary: '#1677ff',
                colorLink: '#1677ff',
                borderRadius: 10,
                borderRadiusLG: 10,
                colorBgLayout: themeMode === 'dark' ? '#0b0b0f' : '#f6f7f9',
                colorBorderSecondary:
                    themeMode === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.08)',
                fontSize: 14,
                wireframe: false,
            },
            components: {
                Layout: {
                    headerBg: themeMode === 'dark' ? '#16161c' : '#ffffff',
                    headerHeight: 56,
                    headerPadding: 0,
                    siderBg: themeMode === 'dark' ? '#121218' : '#ffffff',
                    bodyBg: themeMode === 'dark' ? '#0b0b0f' : '#f6f7f9',
                },
                Card: {
                    boxShadowTertiary: 'none',
                    paddingLG: 20,
                },
                Menu: {
                    itemSelectedBg: themeMode === 'dark' ? 'rgba(22,119,255,0.24)' : '#e6f4ff',
                    itemSelectedColor: themeMode === 'dark' ? '#69b1ff' : '#1677ff',
                    itemBorderRadius: 8,
                    itemHeight: 38,
                    groupTitleColor: 'var(--ews-text-muted)',
                },
                Table: {
                    headerBg: 'transparent',
                    headerSplitColor: 'transparent',
                },
            },
        }),
        [themeMode],
    );

    return (
        <ConfigProvider locale={zhCN} theme={themeConfig}>
            <AntdApp>
                <StaticApiBinder/>
                <ErrorBoundary>
                    <RouterProvider router={router}/>
                </ErrorBoundary>
            </AntdApp>
        </ConfigProvider>
    );
}
