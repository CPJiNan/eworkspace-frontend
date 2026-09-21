import type {User} from '@/types';

const ACCESS_TOKEN_KEY = 'eworkspace.accessToken';
const REFRESH_TOKEN_KEY = 'eworkspace.refreshToken';
const USER_KEY = 'eworkspace.user';

function read(key: string): string | null {
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

function write(key: string, value: string | null): void {
    try {
        if (value === null) {
            window.localStorage.removeItem(key);
        } else {
            window.localStorage.setItem(key, value);
        }
    } catch {
    }
}

export const authStorage = {
    getAccessToken(): string | null {
        return read(ACCESS_TOKEN_KEY);
    },
    getRefreshToken(): string | null {
        return read(REFRESH_TOKEN_KEY);
    },
    getUser(): User | null {
        const raw = read(USER_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as User;
        } catch {
            return null;
        }
    },
    save(accessToken: string, refreshToken: string, user: User): void {
        write(ACCESS_TOKEN_KEY, accessToken);
        write(REFRESH_TOKEN_KEY, refreshToken);
        write(USER_KEY, JSON.stringify(user));
    },
    saveUser(user: User): void {
        write(USER_KEY, JSON.stringify(user));
    },
    clear(): void {
        write(ACCESS_TOKEN_KEY, null);
        write(REFRESH_TOKEN_KEY, null);
        write(USER_KEY, null);
    },
};
