import {create} from 'zustand';

const THEME_KEY = 'eworkspace.theme';
const SIDER_KEY = 'eworkspace.siderCollapsed';

export type ThemeMode = 'light' | 'dark';

function readTheme(): ThemeMode {
    try {
        const value = window.localStorage.getItem(THEME_KEY);
        if (value === 'dark' || value === 'light') return value;
    } catch {
    }
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
}

function readCollapsed(): boolean {
    try {
        return window.localStorage.getItem(SIDER_KEY) === '1';
    } catch {
        return false;
    }
}

interface UiState {
    theme: ThemeMode;
    siderCollapsed: boolean;

    setTheme: (theme: ThemeMode) => void;
    toggleTheme: () => void;
    setSiderCollapsed: (collapsed: boolean) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
    theme: readTheme(),
    siderCollapsed: readCollapsed(),

    setTheme: (theme) => {
        try {
            window.localStorage.setItem(THEME_KEY, theme);
        } catch {
        }
        set({theme});
    },

    toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),

    setSiderCollapsed: (collapsed) => {
        try {
            window.localStorage.setItem(SIDER_KEY, collapsed ? '1' : '0');
        } catch {
        }
        set({siderCollapsed: collapsed});
    },
}));
