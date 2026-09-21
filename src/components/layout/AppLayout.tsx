import {useMemo, useState} from 'react';
import {Link, Outlet, useLocation, useNavigate} from 'react-router-dom';
import {
    AppstoreOutlined,
    BellOutlined,
    CalendarOutlined,
    CarryOutOutlined,
    DashboardOutlined,
    FileSearchOutlined,
    LockOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuOutlined,
    MenuUnfoldOutlined,
    MoonOutlined,
    SunOutlined,
    TeamOutlined,
    UnorderedListOutlined,
    UserOutlined,
} from '@ant-design/icons';
import {Avatar, Badge, Button, Drawer, Dropdown, Layout, Menu, Space, Tooltip, Typography} from 'antd';

import {useUnreadCount} from '@/hooks/useUnreadCount';
import {useIsMobile} from '@/hooks/useIsMobile';
import {canManage, useAuthStore} from '@/stores/authStore';
import {useUiStore} from '@/stores/uiStore';
import {nameInitial} from '@/utils/format';

const {Sider, Content} = Layout;

interface NavItem {
    key: string;
    label: string;
    icon: React.ReactNode;
    adminOnly?: boolean;
    group: 'workspace' | 'admin';
}

const NAV_ITEMS: NavItem[] = [
    {
        key: '/dashboard',
        label: '仪表盘',
        icon: <DashboardOutlined/>,
        group: 'workspace',
    },
    {
        key: '/projects',
        label: '项目列表',
        icon: <AppstoreOutlined/>,
        group: 'workspace',
    },
    {
        key: '/calendar',
        label: '日历视图',
        icon: <CalendarOutlined/>,
        group: 'workspace',
    },
    {
        key: '/my/tasks',
        label: '我的任务',
        icon: <CarryOutOutlined/>,
        group: 'workspace',
    },
    {
        key: '/notifications',
        label: '站内短信',
        icon: <BellOutlined/>,
        group: 'workspace',
    },
    {
        key: '/admin/projects',
        label: '项目管理',
        icon: <AppstoreOutlined/>,
        adminOnly: true,
        group: 'admin',
    },
    {
        key: '/admin/members',
        label: '成员管理',
        icon: <TeamOutlined/>,
        adminOnly: true,
        group: 'admin',
    },
    {
        key: '/admin/logs',
        label: '操作日志',
        icon: <FileSearchOutlined/>,
        adminOnly: true,
        group: 'admin',
    },
];

const MOBILE_TABS = ['/dashboard', '/projects', '/my/tasks', '/notifications'];

export function AppLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const isMobile = useIsMobile();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const {unread, refresh: refreshUnread} = useUnreadCount();
    const theme = useUiStore((state) => state.theme);
    const toggleTheme = useUiStore((state) => state.toggleTheme);
    const collapsed = useUiStore((state) => state.siderCollapsed);
    const setCollapsed = useUiStore((state) => state.setSiderCollapsed);

    const isAdmin = canManage(user?.role);

    const navItems = useMemo(
        () => NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin),
        [isAdmin],
    );

    const current = useMemo(() => {
        return [...navItems]
            .sort((a, b) => b.key.length - a.key.length)
            .find((item) => location.pathname === item.key || location.pathname.startsWith(`${item.key}/`));
    }, [location.pathname, navItems]);

    const handleLogout = async () => {
        await logout();
        navigate('/login', {replace: true});
    };

    const userMenu = {
        items: [
            {
                key: 'profile',
                icon: <UserOutlined/>,
                label: '个人信息',
                onClick: () => navigate('/profile'),
            },
            {
                key: 'password',
                icon: <LockOutlined/>,
                label: '修改密码',
                onClick: () => navigate('/password'),
            },
            {type: 'divider' as const},
            {
                key: 'logout',
                icon: <LogoutOutlined/>,
                label: '退出登录',
                danger: true,
                onClick: handleLogout,
            },
        ],
    };

    const menuItems = useMemo(() => {
        const workspace = navItems.filter((item) => item.group === 'workspace');
        const admin = navItems.filter((item) => item.group === 'admin');

        const items: React.ComponentProps<typeof Menu>['items'] = [
            {type: 'group' as const, label: collapsed ? '' : '工作台', children: toMenuItems(workspace)},
        ];
        if (admin.length > 0) {
            items.push({
                type: 'group' as const,
                label: collapsed ? '' : '管理',
                children: toMenuItems(admin),
            });
        }
        return items;

        function toMenuItems(source: NavItem[]) {
            return source.map((item) => ({
                key: item.key,
                icon: item.icon,
                label: <Link to={item.key}>{item.label}</Link>,
            }));
        }
    }, [navItems, collapsed]);

    const siderContent = (
        <>
            <Link to="/dashboard" className="ews-brand">
                <span className="ews-brand__mark">E</span>
                {!collapsed || isMobile ? <span className="ews-brand__name">EWorkspace</span> : null}
            </Link>

            <div style={{flex: 1, overflowY: 'auto', overflowX: 'hidden'}}>
                <Menu
                    mode="inline"
                    className="ews-nav-menu"
                    selectedKeys={current ? [current.key] : []}
                    items={menuItems}
                    inlineCollapsed={collapsed && !isMobile}
                />
            </div>

            <div className="ews-sider__footer">
                <Tooltip title={`切换${theme === 'dark' ? '浅色' : '深色'}模式`} placement="right">
                    <Button
                        type="text"
                        className="ews-nav-button"
                        aria-label="切换深色模式"
                        icon={theme === 'dark' ? <SunOutlined/> : <MoonOutlined/>}
                        onClick={toggleTheme}
                    >
                        {theme === 'dark' ? '浅色模式' : '深色模式'}
                    </Button>
                </Tooltip>
                {!isMobile ? (
                    <Tooltip title={collapsed ? '展开侧边栏' : '收起侧边栏'} placement="right">
                        <Button
                            type="text"
                            className="ews-nav-button"
                            aria-label="收起侧边栏"
                            icon={collapsed ? <MenuUnfoldOutlined/> : <MenuFoldOutlined/>}
                            onClick={() => setCollapsed(!collapsed)}
                        >
                            {collapsed ? '展开' : '收起'}
                        </Button>
                    </Tooltip>
                ) : null}
            </div>
        </>
    );

    return (
        <Layout style={{minHeight: '100vh', background: 'var(--ews-bg-page)'}}>
            {!isMobile ? (
                <Sider
                    className="ews-sider"
                    theme="light"
                    width={216}
                    collapsedWidth={64}
                    collapsed={collapsed}
                    style={{
                        background: 'var(--ews-bg-sider)',
                        borderInlineEnd: '1px solid var(--ews-border)',
                        position: 'sticky',
                        top: 0,
                        height: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {siderContent}
                </Sider>
            ) : null}

            <Layout style={{background: 'transparent'}}>
                <header className="ews-header">
                    {isMobile ? (
                        <Button
                            type="text"
                            aria-label="打开导航"
                            icon={<MenuOutlined/>}
                            onClick={() => setDrawerOpen(true)}
                        />
                    ) : null}

                    <Space direction="vertical" size={0} style={{flex: 1, minWidth: 0}}>
                        <span className="ews-header__title">{current?.label ?? 'EWorkspace'}</span>
                    </Space>

                    <Space size={isMobile ? 4 : 12}>
                        <Badge count={unread} size="small" overflowCount={99}>
                            <Tooltip title="站内短信">
                                <Button
                                    type="text"
                                    aria-label="站内短信"
                                    icon={<BellOutlined/>}
                                    onClick={() => {
                                        navigate('/notifications');
                                        refreshUnread();
                                    }}
                                />
                            </Tooltip>
                        </Badge>

                        <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
                            <Space style={{cursor: 'pointer'}} size={8}>
                                <Avatar size={28} style={{backgroundColor: 'var(--ews-primary)'}}>
                                    {nameInitial(user?.name)}
                                </Avatar>
                                {!isMobile ? <Typography.Text>{user?.name}</Typography.Text> : null}
                            </Space>
                        </Dropdown>
                    </Space>
                </header>

                <Content
                    style={{
                        padding: isMobile ? '12px 12px 76px' : '20px 24px 32px',
                        width: '100%',
                    }}
                >
                    <div className="ews-page">
                        <Outlet/>
                    </div>
                </Content>
            </Layout>

            {isMobile ? (
                <>
                    <Drawer
                        placement="left"
                        open={drawerOpen}
                        onClose={() => setDrawerOpen(false)}
                        width={248}
                        styles={{
                            body: {padding: 0, display: 'flex', flexDirection: 'column'},
                            header: {display: 'none'}
                        }}
                    >
                        {siderContent}
                    </Drawer>

                    <nav
                        style={{
                            position: 'fixed',
                            insetInline: 0,
                            bottom: 0,
                            zIndex: 30,
                            display: 'flex',
                            justifyContent: 'space-around',
                            alignItems: 'center',
                            height: 56,
                            paddingBottom: 'env(safe-area-inset-bottom)',
                            background: 'var(--ews-bg-container)',
                            borderTop: '1px solid var(--ews-border)',
                        }}
                    >
                        {navItems
                            .filter((item) => MOBILE_TABS.includes(item.key))
                            .map((item) => {
                                const active = current?.key === item.key;
                                return (
                                    <Link
                                        key={item.key}
                                        to={item.key}
                                        style={{
                                            flex: 1,
                                            textAlign: 'center',
                                            color: active ? 'var(--ews-primary)' : 'var(--ews-text-muted)',
                                            fontSize: 11,
                                        }}
                                    >
                                        <div style={{fontSize: 18}}>{item.icon}</div>
                                        <div>{item.label}</div>
                                    </Link>
                                );
                            })}
                        <a
                            onClick={() => setDrawerOpen(true)}
                            style={{flex: 1, textAlign: 'center', fontSize: 11, color: 'var(--ews-text-muted)'}}
                        >
                            <div style={{fontSize: 18}}>
                                <UnorderedListOutlined/>
                            </div>
                            <div>更多</div>
                        </a>
                    </nav>
                </>
            ) : null}
        </Layout>
    );
}
