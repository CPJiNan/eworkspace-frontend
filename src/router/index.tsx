import {createBrowserRouter, Navigate, type RouteObject} from 'react-router-dom';

import {AppLayout} from '@/components/layout/AppLayout';
import {RequireAdmin, RequireAuth, RequirePasswordChanged} from '@/components/layout/guards';
import {CalendarPage} from '@/pages/calendar/CalendarPage';
import {DashboardPage} from '@/pages/dashboard/DashboardPage';
import {LoginPage} from '@/pages/login/LoginPage';
import {LogsPage} from '@/pages/admin/LogsPage';
import {MemberDetailPage} from '@/pages/admin/MemberDetailPage';
import {MembersPage} from '@/pages/admin/MembersPage';
import {AdminProjectsPage} from '@/pages/admin/AdminProjectsPage';
import {ProjectFormPage} from '@/pages/admin/ProjectFormPage';
import {MyTasksPage} from '@/pages/tasks/MyTasksPage';
import {NotificationsPage} from '@/pages/notifications/NotificationsPage';
import {PasswordPage} from '@/pages/password/PasswordPage';
import {ProfilePage} from '@/pages/profile/ProfilePage';
import {ProjectDetailPage} from '@/pages/projects/ProjectDetailPage';
import {ProjectListPage} from '@/pages/projects/ProjectListPage';
import {NotFoundPage} from '@/pages/NotFoundPage';

export function buildRoutes(): RouteObject[] {
    return [
        {path: '/login', element: <LoginPage/>},

        {
            element: <RequireAuth/>,
            children: [
                {path: '/password', element: <PasswordPage/>},
                {
                    element: <RequirePasswordChanged/>,
                    children: [
                        {
                            element: <AppLayout/>,
                            children: [
                                {index: true, element: <Navigate to="/dashboard" replace/>},
                                {path: '/dashboard', element: <DashboardPage/>},
                                {path: '/projects', element: <ProjectListPage/>},
                                {path: '/projects/:id', element: <ProjectDetailPage/>},
                                {path: '/calendar', element: <CalendarPage/>},
                                {path: '/my/tasks', element: <MyTasksPage/>},
                                {path: '/notifications', element: <NotificationsPage/>},
                                {path: '/profile', element: <ProfilePage/>},

                                {
                                    element: <RequireAdmin/>,
                                    children: [
                                        {path: '/admin/projects', element: <AdminProjectsPage/>},
                                        {path: '/admin/projects/new', element: <ProjectFormPage/>},
                                        {path: '/admin/projects/:id/edit', element: <ProjectFormPage/>},
                                        {path: '/admin/members', element: <MembersPage/>},
                                        {path: '/admin/members/:studentId', element: <MemberDetailPage/>},
                                        {path: '/admin/logs', element: <LogsPage/>},
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        },

        {path: '*', element: <NotFoundPage/>},
    ];
}

export const router = createBrowserRouter(buildRoutes());
