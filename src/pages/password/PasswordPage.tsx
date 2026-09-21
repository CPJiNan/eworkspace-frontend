import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {LockOutlined} from '@ant-design/icons';
import {Alert, Button, Card, Form, Input, Space, Typography} from 'antd';

import {ApiError} from '@/api/error';
import {authApi} from '@/api/auth';
import {useAuthStore} from '@/stores/authStore';
import {getStaticApi} from '@/utils/antdStatic';

interface PasswordForm {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export function PasswordPage() {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const clear = useAuthStore((state) => state.clear);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const forced = Boolean(user?.mustChangePassword);

    const handleSubmit = async (values: PasswordForm) => {
        setSubmitting(true);
        setErrorMessage(null);
        try {
            await authApi.changePassword({
                oldPassword: values.oldPassword,
                newPassword: values.newPassword,
            });
            getStaticApi()?.message.success('密码修改成功');
            clear();
            navigate('/login', {replace: true});
        } catch (error) {
            const message = error instanceof ApiError ? error.message : '修改失败';
            setErrorMessage(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
            }}
        >
            <Card style={{width: '100%', maxWidth: 420}}>
                <Space direction="vertical" size={4} style={{width: '100%'}}>
                    <Typography.Title level={4} style={{marginBottom: 0}}>
                        修改密码
                    </Typography.Title>
                </Space>

                {forced ? (
                    <Alert
                        type="warning"
                        showIcon
                        message="请设置新密码"
                        description="密码至少 8 位，且同时包含字母与数字。"
                        style={{marginTop: 16}}
                    />
                ) : null}

                {errorMessage ? (
                    <Alert
                        type="error"
                        showIcon
                        message={errorMessage}
                        style={{marginTop: 16}}
                        closable
                        onClose={() => setErrorMessage(null)}
                    />
                ) : null}

                <Form<PasswordForm> layout="vertical" onFinish={handleSubmit} style={{marginTop: 16}}>
                    <Form.Item
                        name="oldPassword"
                        label={forced ? '初始密码' : '当前密码'}
                        rules={[{required: true, message: '请输入当前密码'}]}
                    >
                        <Input.Password prefix={<LockOutlined/>} autoComplete="current-password"/>
                    </Form.Item>

                    <Form.Item
                        name="newPassword"
                        label="新密码"
                        rules={[
                            {required: true, message: '请输入新密码'},
                            {min: 8, message: '长度至少 8 位'},
                            {max: 64, message: '长度不能超过 64 位'},
                            {
                                pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/,
                                message: '必须同时包含字母和数字',
                            },
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined/>} autoComplete="new-password"/>
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        label="确认新密码"
                        dependencies={['newPassword']}
                        rules={[
                            {required: true, message: '请再次输入新密码'},
                            ({getFieldValue}) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('两次输入的密码不一致'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined/>} autoComplete="new-password"/>
                    </Form.Item>

                    <Form.Item style={{marginBottom: forced ? 0 : 8}}>
                        <Button type="primary" htmlType="submit" block loading={submitting}>
                            确认修改
                        </Button>
                    </Form.Item>
                </Form>

                {!forced ? (
                    <Button type="link" block onClick={() => navigate(-1)} style={{padding: 0}}>
                        返回上一页
                    </Button>
                ) : null}
            </Card>
        </div>
    );
}
