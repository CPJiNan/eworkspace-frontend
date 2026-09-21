import {useState} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {LockOutlined, UserOutlined} from '@ant-design/icons';
import {Alert, Button, Card, Form, Input, Space, Typography} from 'antd';

import {ApiError} from '@/api/error';
import {useAuthStore} from '@/stores/authStore';
import {getStaticApi} from '@/utils/antdStatic';
import {postLoginPath} from '@/utils/redirect';

interface LoginForm {
    studentId: string;
    password: string;
}

export function LoginPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const login = useAuthStore((state) => state.login);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const redirect = searchParams.get('redirect');

    const handleSubmit = async (values: LoginForm) => {
        setSubmitting(true);
        setErrorMessage(null);
        try {
            const result = await login(values.studentId.trim(), values.password);
            getStaticApi()?.message.success(`欢迎回来，${result.user.name}`);

            if (result.user.mustChangePassword) {
                navigate('/password', {replace: true});
                return;
            }
            navigate(postLoginPath(redirect), {replace: true});
        } catch (error) {
            const message = error instanceof ApiError ? error.message : '登录失败，请稍后重试';
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
                background:
                    'linear-gradient(135deg, rgba(22,119,255,0.12) 0%, rgba(22,119,255,0.02) 60%)',
            }}
        >
            <Card style={{width: '100%', maxWidth: 400}} variant="outlined">
                <Space direction="vertical" size={4} style={{width: '100%', textAlign: 'center'}}>
                    <Typography.Title level={3} style={{marginBottom: 0}}>
                        EWorkspace
                    </Typography.Title>
                    <Typography.Text type="secondary" style={{fontSize: 13}}>
                        复旦大学未来信息创新学院宣传部工作平台
                    </Typography.Text>
                </Space>

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

                <Form<LoginForm> layout="vertical" onFinish={handleSubmit} style={{marginTop: 16}} requiredMark={false}>
                    <Form.Item
                        name="studentId"
                        label="学号"
                        rules={[
                            {required: true, message: '请输入学号'},
                            {pattern: /^\d{1,20}$/, message: '学号必须是 11 位数字'},
                        ]}
                    >
                        <Input
                            size="large"
                            prefix={<UserOutlined/>}
                            placeholder="请输入学号"
                            autoComplete="username"
                            inputMode="numeric"
                            allowClear
                        />
                    </Form.Item>

                    <Form.Item name="password" label="密码" rules={[{required: true, message: '请输入密码'}]}>
                        <Input.Password
                            size="large"
                            prefix={<LockOutlined/>}
                            placeholder="请输入密码"
                            autoComplete="current-password"
                        />
                    </Form.Item>

                    <Form.Item style={{marginBottom: 8}}>
                        <Button type="primary" size="large" htmlType="submit" block loading={submitting}>
                            登 录
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}
