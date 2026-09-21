import type {MessageInstance} from 'antd/es/message/interface';
import type {HookAPI as ModalHookAPI} from 'antd/es/modal/useModal';
import type {NotificationInstance} from 'antd/es/notification/interface';

interface StaticApi {
    message: MessageInstance;
    notification: NotificationInstance;
    modal: Omit<ModalHookAPI, 'warn'>;
}

let api: StaticApi | null = null;

export function bindStaticApi(instance: StaticApi): void {
    api = instance;
}

export function getStaticApi(): StaticApi | null {
    return api;
}
