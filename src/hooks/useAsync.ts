import {useCallback, useEffect, useRef, useState} from 'react';

import {getStaticApi} from '@/utils/antdStatic';
import {ApiError} from '@/api/error';

export interface AsyncState<T> {
    data: T | undefined;
    loading: boolean;
    error: ApiError | undefined;
    reload: () => void;
    setData: (updater: T | ((prev: T | undefined) => T)) => void;
}

interface Options {
    toastOnError?: boolean;
    enabled?: boolean;
}

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[], options: Options = {}): AsyncState<T> {
    const {toastOnError = true, enabled = true} = options;
    const [data, setData] = useState<T | undefined>(undefined);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState<ApiError | undefined>(undefined);
    const [nonce, setNonce] = useState(0);

    const fnRef = useRef(fn);
    fnRef.current = fn;

    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            return undefined;
        }
        let cancelled = false;
        setLoading(true);
        setError(undefined);

        fnRef
            .current()
            .then((result) => {
                if (cancelled) return;
                setData(result);
            })
            .catch((err: unknown) => {
                if (cancelled) return;
                const apiError = err instanceof ApiError ? err : new ApiError(0, 'UNKNOWN', '请求失败');
                setError(apiError);
                if (toastOnError && !apiError.isUnauthorized) {
                    getStaticApi()?.message.error(apiError.message);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [...deps, nonce, enabled, toastOnError]);

    const reload = useCallback(() => setNonce((value) => value + 1), []);

    const update = useCallback((updater: T | ((prev: T | undefined) => T)) => {
        setData((prev) =>
            typeof updater === 'function' ? (updater as (p: T | undefined) => T)(prev) : updater,
        );
    }, []);

    return {data, loading, error, reload, setData: update};
}
