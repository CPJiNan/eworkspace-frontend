import {Input, Space, Typography} from 'antd';
import type {TextAreaProps} from 'antd/es/input';
import type {ChangeEvent} from 'react';
import {useState} from 'react';

export interface CountedTextAreaProps extends Omit<TextAreaProps, 'showCount' | 'count'> {
    limit: number;
    hint?: React.ReactNode;
    actions?: React.ReactNode;
}

export function CountedTextArea({
                                    limit,
                                    hint,
                                    actions,
                                    value,
                                    onChange,
                                    ...textAreaProps
                                }: CountedTextAreaProps) {
    const [innerLength, setInnerLength] = useState(0);
    const used = typeof value === 'string' ? value.length : innerLength;
    const nearLimit = used >= limit * 0.9;

    const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        if (typeof value !== 'string') {
            setInnerLength(event.target.value.length);
        }
        onChange?.(event);
    };

    return (
        <Space direction="vertical" size={6} style={{width: '100%'}}>
            <Input.TextArea
                maxLength={limit}
                value={value}
                onChange={handleChange}
                {...textAreaProps}
            />
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                }}
            >
                {hint ? (
                    <Typography.Text type="secondary" style={{fontSize: 12}}>
                        {hint}
                    </Typography.Text>
                ) : null}
                <Space size={12} align="center">
                    <Typography.Text
                        type={nearLimit ? 'danger' : 'secondary'}
                        style={{fontSize: 12, fontVariantNumeric: 'tabular-nums'}}
                    >
                        {used} / {limit}
                    </Typography.Text>
                    {actions}
                </Space>
            </div>
        </Space>
    );
}
