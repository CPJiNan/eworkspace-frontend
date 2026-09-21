import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.locale('zh-cn');
dayjs.extend(relativeTime);

export function formatDateTime(value?: string | null): string {
    if (!value) return '';
    const d = dayjs(value);
    return d.isValid() ? d.format('YYYY-MM-DD HH:mm') : '';
}

export function formatFromNow(value?: string | null): string {
    if (!value) return '';
    const d = dayjs(value);
    return d.isValid() ? d.fromNow() : '';
}

export function formatDeadline(value: string, status?: string): { text: string; overdue: boolean } {
    const d = dayjs(value);
    if (!d.isValid()) return {text: '', overdue: false};

    const text = d.format('YYYY-MM-DD HH:mm');
    if (status && status !== 'active') {
        return {text, overdue: false};
    }

    const now = dayjs();
    const overdue = d.isBefore(now);
    if (overdue) {
        return {text: `${text}（已逾期 ${d.fromNow(true)}）`, overdue: true};
    }
    const days = d.diff(now, 'day');
    const hours = d.diff(now, 'hour');
    if (days >= 1) {
        return {text: `${text}（剩余 ${days} 天）`, overdue: false};
    }
    if (hours >= 1) {
        return {text: `${text}（剩余 ${hours} 小时）`, overdue: false};
    }
    return {text: `${text}（不足 1 小时）`, overdue: false};
}

export function capacityText(claimed: number, capacity: number): string {
    return `${claimed}/${capacity}`;
}

export function truncate(text: string, max = 60): string {
    if (!text) return '';
    return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function nameInitial(name?: string): string {
    if (!name) return '?';
    return name.trim().slice(0, 1).toUpperCase();
}
