import {useCallback, useEffect, useState} from 'react';

import {notificationApi} from '@/api/notification';
import {useAuthStore} from '@/stores/authStore';

const POLL_INTERVAL = 30_000;

export function useUnreadCount(): { unread: number; refresh: () => void } {
    const user = useAuthStore((state) => state.user);
    const [unread, setUnread] = useState(0);

    const refresh = useCallback(() => {
        if (!user) return;
        notificationApi
            .list(1, 1)
            .then((result) => setUnread(result.unreadCount))
            .catch(() => {
            });
    }, [user]);

    useEffect(() => {
        if (!user) {
            setUnread(0);
            return undefined;
        }
        refresh();
        const timer = window.setInterval(refresh, POLL_INTERVAL);
        return () => window.clearInterval(timer);
    }, [user, refresh]);

    return {unread, refresh};
}
