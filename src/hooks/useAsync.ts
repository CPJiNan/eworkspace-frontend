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

    const fnRef = useRef(fn);
    fnRef.current = fn;
    const runIdRef = useRef(0);

    const run = useCallback(() => {
        const runId = runIdRef.current + 1;
        runIdRef.current = runId;
        setLoading(true);
        setError(undefined);

        fnRef
            .current()
            .then((result) => {
                if (runId !== runIdRef.current) return;
                setData(result);
            })
            .catch((err: unknown) => {
                if (runId !== runIdRef.current) return;
                const apiError = err instanceof ApiError ? err : new ApiError(0, 'UNKNOWN', '请求失败');
                setError(apiError);
                if (toastOnError && !apiError.isUnauthorized) {
                    getStaticApi()?.message.error(apiError.message);
                }
            })
            .finally(() => {
                if (runId === runIdRef.current) setLoading(false);
            });
    }, [toastOnError]);

    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            return undefined;
        }
        run();
        return () => {
            runIdRef.current += 1;
        };
    }, [run, enabled, ...deps]);

    const reload = useCallback(() => {
        run();
    }, [run]);

    const update = useCallback((updater: T | ((prev: T | undefined) => T)) => {
        setData((prev) =>
            typeof updater === 'function' ? (updater as (p: T | undefined) => T)(prev) : updater,
        );
    }, []);

    return {data, loading, error, reload, setData: update};
}
