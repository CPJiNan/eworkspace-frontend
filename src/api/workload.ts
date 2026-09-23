import type {WorkloadRanking} from '@/types';
import {api} from './client';

export const workloadApi = {
    ranking: (semesterIds: number[] = []) =>
        api.get<WorkloadRanking>('/workload/ranking', {
            semesterIds: semesterIds.length > 0 ? semesterIds.join(',') : undefined,
        }),
};
