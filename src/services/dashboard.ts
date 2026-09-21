import {logApi} from '@/api/log';
import {notificationApi} from '@/api/notification';
import {projectApi} from '@/api/project';
import {userApi} from '@/api/user';
import {type Notification, type OperationLog, type Project, Role, type User} from '@/types';

export interface DashboardStats {
    activeProjects: number;
    totalAssignments: number;
    claimedSeats: number;
    totalSeats: number;
    myTasks: number;
    myProjects: number;
    unreadNotifications: number;
    nextDeadline?: string;
    overdueTasks: number;
    finishedProjects: number;
    totalMembers?: number;
    bannedMembers?: number;
    totalLogs?: number;
    latestLog?: OperationLog;
}

export interface DashboardData {
    stats: DashboardStats;
    recentProjects: Project[];
    upcomingProjects: Project[];
    myTasks: Array<{
        projectId: number;
        projectName: string;
        assignmentName: string;
        deadline: string;
        projectStatus: string;
    }>;
    recentNotifications: Notification[];
    partial: boolean;
}

const DAY = 24 * 3600 * 1000;

export async function loadDashboard(user: User): Promise<DashboardData> {
    const isAdmin = user.role === Role.Admin || user.role === Role.SuperAdmin;

    const [activeRes, allRes, tasksRes, noticesRes, membersRes, logsRes] = await Promise.allSettled([
        projectApi.list({page: 1, size: 50}),
        projectApi.list({includeAll: true, page: 1, size: 50}),
        projectApi.myTasks({page: 1, size: 10}),
        notificationApi.list(1, 5),
        isAdmin ? userApi.listMembers({page: 1, size: 1}) : Promise.resolve(undefined),
        isAdmin ? logApi.list({page: 1, size: 5}) : Promise.resolve(undefined),
    ]);

    const activeProjects = unwrap(activeRes)?.items ?? [];
    const allProjects = unwrap(allRes)?.items ?? [];
    const myTasks = unwrap(tasksRes)?.items ?? [];
    const notifications = unwrap(noticesRes);

    const now = Date.now();

    const myProjects = allProjects.filter((project) => project.mine);

    const activePage = unwrap(activeRes)?.page;
    let totalAssignments = 0;
    let claimedSeats = 0;
    let totalSeats = 0;
    for (const project of activeProjects) {
        totalAssignments += project.assignments.length;
        claimedSeats += project.totalClaimed;
        totalSeats += project.totalCapacity;
    }

    const upcoming = activeProjects
        .filter((project) => {
            const deadline = new Date(project.deadline).getTime();
            return Number.isFinite(deadline) && deadline >= now && deadline - now <= 7 * DAY;
        })
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

    const upcomingProjects =
        upcoming.length > 0
            ? upcoming.slice(0, 5)
            : [...activeProjects]
                .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
                .slice(0, 5);

    const overdueTasks = myTasks.filter(
        (task) => task.projectStatus === 'active' && new Date(task.deadline).getTime() < now,
    ).length;

    const nextDeadline = myTasks
        .filter((task) => task.projectStatus === 'active' && new Date(task.deadline).getTime() >= now)
        .map((task) => task.deadline)
        .sort()[0];

    const members = unwrap(membersRes);
    const logs = unwrap(logsRes);

    const stats: DashboardStats = {
        activeProjects: activePage?.total ?? activeProjects.length,
        totalAssignments,
        claimedSeats,
        totalSeats,
        myTasks: unwrap(tasksRes)?.page?.total ?? myTasks.length,
        myProjects: myProjects.length,
        unreadNotifications: notifications?.unreadCount ?? 0,
        nextDeadline,
        overdueTasks,
        finishedProjects: myProjects.filter((project) => project.status !== 'active').length,
        totalMembers: isAdmin ? members?.page?.total : undefined,
        bannedMembers: undefined,
        totalLogs: isAdmin ? logs?.page?.total : undefined,
        latestLog: isAdmin ? logs?.items?.[0] : undefined,
    };

    return {
        stats,
        recentProjects: allProjects.slice(0, 5),
        upcomingProjects,
        myTasks: myTasks.slice(0, 5).map((task) => ({
            projectId: task.projectId,
            projectName: task.projectName,
            assignmentName: task.assignmentName,
            deadline: task.deadline,
            projectStatus: task.projectStatus,
        })),
        recentNotifications: notifications?.items ?? [],
        partial: [activeRes, tasksRes, noticesRes].some((result) => result.status === 'rejected'),
    };
}

function unwrap<T>(result: PromiseSettledResult<T | undefined>): T | undefined {
    return result.status === 'fulfilled' ? result.value : undefined;
}

