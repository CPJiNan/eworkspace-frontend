import {RightOutlined} from '@ant-design/icons';

export type StatTone = 'blue' | 'green' | 'orange' | 'purple' | 'cyan' | 'red' | 'gray';

interface StatCardProps {
    label: string;
    value: React.ReactNode;
    icon?: React.ReactNode;
    tone?: StatTone;
    extra?: React.ReactNode;
    onClick?: () => void;
}

export function StatCard({label, value, icon, tone = 'blue', extra, onClick}: StatCardProps) {
    const body = (
        <>
            {icon ? (
                <span
                    className="ews-stat__icon"
                    style={{
                        background: `var(--ews-tone-${tone}-bg)`,
                        color: `var(--ews-tone-${tone}-fg)`,
                    }}
                >
                    {icon}
                </span>
            ) : null}
            <div style={{minWidth: 0, flex: 1}}>
                <div className="ews-stat__label">{label}</div>
                <div className="ews-stat__value">{value}</div>
                {extra ? <div className="ews-stat__extra">{extra}</div> : null}
            </div>
        </>
    );

    if (onClick) {
        return (
            <button type="button" className="ews-stat" onClick={onClick}>
                {body}
            </button>
        );
    }
    return <div className="ews-stat">{body}</div>;
}

interface PanelProps {
    title: React.ReactNode;
    extra?: React.ReactNode;
    children: React.ReactNode;
    tight?: boolean;
    style?: React.CSSProperties;
}

export function Panel({title, extra, children, tight = false, style}: PanelProps) {
    return (
        <section className="ews-panel" style={style}>
            <div className="ews-panel__head">
                <span className="ews-panel__title">{title}</span>
                {extra}
            </div>
            <div className={tight ? 'ews-panel__body ews-panel__body--tight' : 'ews-panel__body'}>
                {children}
            </div>
        </section>
    );
}

interface ActionRowProps {
    icon?: React.ReactNode;
    title: string;
    desc?: string;
    onClick: () => void;
}

export function ActionRow({icon, title, desc, onClick}: ActionRowProps) {
    return (
        <button type="button" className="ews-action" onClick={onClick}>
            {icon ? <span className="ews-stat__icon" style={{width: 30, height: 30, fontSize: 14}}>{icon}</span> : null}
            <div style={{flex: 1, minWidth: 0}}>
                <div className="ews-action__title">{title}</div>
                {desc ? <div className="ews-action__desc">{desc}</div> : null}
            </div>
            <RightOutlined style={{fontSize: 12, color: 'var(--ews-text-muted)'}}/>
        </button>
    );
}

interface ToolbarProps {
    children: React.ReactNode;
    extra?: React.ReactNode;
}

export function Toolbar({children, extra}: ToolbarProps) {
    return (
        <div className="ews-toolbar">
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                }}
            >
                <div style={{display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1, minWidth: 0}}>
                    {children}
                </div>
                {extra}
            </div>
        </div>
    );
}
