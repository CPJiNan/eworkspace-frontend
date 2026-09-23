const NON_REDIRECTABLE = ['/login', '/password'];

function normalize(path: string): string {
    if (!path.startsWith('/')) return `/${path}`;
    if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
    return path;
}

export function isRedirectablePath(path: string | undefined | null): path is string {
    if (!path) return false;
    if (path.includes('\\') || path.startsWith('//')) return false;
    for (const ch of path) {
        const code = ch.charCodeAt(0);
        if (code < 0x20 || code === 0x7f) return false;
    }
    const normalized = normalize(path.split('?')[0]);
    return !NON_REDIRECTABLE.some(
        (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
    );
}

export function parseRedirect(search: string): string | null {
    const raw = new URLSearchParams(search).get('redirect');
    if (!raw) return null;
    try {
        const decoded = decodeURIComponent(raw);
        return isRedirectablePath(decoded) ? decoded : null;
    } catch {
        return null;
    }
}

export function redirectFromUrl(fullUrl: string): string | null {
    try {
        const url = new URL(fullUrl);
        if (!isRedirectablePath(url.pathname)) return null;
        return url.pathname + url.search;
    } catch {
        return null;
    }
}

export function loginUrlWithRedirect(target?: string | null): string {
    if (!isRedirectablePath(target)) return '/login';
    return `/login?redirect=${encodeURIComponent(target)}`;
}

export const DEFAULT_LANDING_PATH = '/dashboard';

export function postLoginPath(redirect: string | null | undefined): string {
    return isRedirectablePath(redirect) ? redirect : DEFAULT_LANDING_PATH;
}
