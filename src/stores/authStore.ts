import {create} from 'zustand';

import {authApi} from '@/api/auth';
import {authStorage} from '@/api/authStorage';
import {bindAuthBridge} from '@/api/client';
import type {AuthResult, Role, User} from '@/types';
import {Role as RoleEnum} from '@/types';
import {getStaticApi} from '@/utils/antdStatic';
import {loginUrlWithRedirect, redirectFromUrl} from '@/utils/redirect';

export function canManage(role?: Role): boolean {
    return role === RoleEnum.SuperAdmin || role === RoleEnum.Admin;
}

export function isSuperAdmin(role?: Role): boolean {
    return role === RoleEnum.SuperAdmin;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    initialized: boolean;

    bootstrap: () => void;
    login: (studentId: string, password: string) => Promise<AuthResult>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<User | null>;
    applyAuthResult: (result: AuthResult) => void;
    setUser: (user: User) => void;
    clear: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: authStorage.getUser(),
    accessToken: authStorage.getAccessToken(),
    refreshToken: authStorage.getRefreshToken(),
    initialized: false,

    bootstrap: () => {
        const user = authStorage.getUser();
        const accessToken = authStorage.getAccessToken();
        const refreshToken = authStorage.getRefreshToken();
        if (user && accessToken && refreshToken) {
            set({user, accessToken, refreshToken, initialized: true});
        } else {
            authStorage.clear();
            set({user: null, accessToken: null, refreshToken: null, initialized: true});
        }
    },

    login: async (studentId, password) => {
        const result = await authApi.login({studentId, password});
        authStorage.save(result.accessToken, result.refreshToken, result.user);
        set({user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken});
        return result;
    },

    logout: async () => {
        const {refreshToken} = get();
        if (refreshToken) {
            try {
                await authApi.logout(refreshToken);
            } catch {
            }
        }
        authStorage.clear();
        set({user: null, accessToken: null, refreshToken: null});
    },

    refreshUser: async () => {
        const user = await authApi.me();
        authStorage.saveUser(user);
        set({user});
        return user;
    },

    applyAuthResult: (result) => {
        authStorage.save(result.accessToken, result.refreshToken, result.user);
        set({user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken});
    },

    setUser: (user) => {
        authStorage.saveUser(user);
        set({user});
    },

    clear: () => {
        authStorage.clear();
        set({user: null, accessToken: null, refreshToken: null});
    },
}));

bindAuthBridge({
    getAccessToken: () => useAuthStore.getState().accessToken,
    getRefreshToken: () => useAuthStore.getState().refreshToken,
    applyAuthResult: (result) => {
        useAuthStore.getState().applyAuthResult(result);
    },
    handleSessionExpired: () => {
        const {user, clear} = useAuthStore.getState();
        const target = redirectFromUrl(window.location.href);
        clear();

        if (window.location.pathname.startsWith('/login')) return;

        window.location.replace(loginUrlWithRedirect(target));

        if (user) getStaticApi()?.message.warning('登录状态已失效，请重新登录');
    },
});
