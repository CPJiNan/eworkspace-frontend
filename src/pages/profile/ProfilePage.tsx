import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {LockOutlined, SaveOutlined} from '@ant-design/icons';
import {Alert, Button, Card, Descriptions, Form, Input, Space, Tag} from 'antd';

import {type UpdateProfilePayload, userApi} from '@/api/user';
import {ApiError} from '@/api/error';
import {useAuthStore} from '@/stores/authStore';
import {roleMeta, TEXT_LIMIT} from '@/utils/constants';
import {getStaticApi} from '@/utils/antdStatic';
import {formatDateTime} from '@/utils/format';

interface ProfileForm {
    name: string;
    phone?: string;
    wechat?: string;
    qq?: string;
    email?: string;
}

export function ProfilePage() {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);
    const [submitting, setSubmitting] = useState(false);

    if (!user) return null;

    const meta = roleMeta(user.role);

    const handleSubmit = async (values: ProfileForm) => {
        setSubmitting(true);
        try {
            const payload: UpdateProfilePayload = {
                name: values.name.trim(),
                phone: values.phone?.trim() ?? '',
                wechat: values.wechat?.trim() ?? '',
                qq: values.qq?.trim() ?? '',
                email: values.email?.trim() ?? '',
            };
            const updated = await userApi.updateMe(payload);
            setUser(updated);
            getStaticApi()?.message.success('个人信息已保存');
        } catch (error) {
            getStaticApi()?.message.error(error instanceof ApiError ? error.message : '保存失败');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Space direction="vertical" size={16} style={{width: '100%'}}>
            <Card title="账号信息">
                <Descriptions column={1} size="small" colon={false}>
                    <Descriptions.Item label="学号">{user.studentId}</Descriptions.Item>
                    <Descriptions.Item label="角色">
                        <Tag color={meta.color}>{meta.label}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="账号状态">
                        {user.banned ? (
                            <Tag color="red">已封禁</Tag>
                        ) : (
                            <Tag color="green">正常</Tag>
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label="注册时间">{formatDateTime(user.createdAt)}</Descriptions.Item>
                </Descriptions>
            </Card>

            <Card
                title="编辑个人信息"
                extra={
                    <Button
                        icon={<LockOutlined/>}
                        type="link"
                        onClick={() => {
                            navigate('/password');
                        }}
                        style={{paddingInline: 0}}
                    >
                        修改密码
                    </Button>
                }
            >
                {user.banned ? (
                    <Alert
                        type="warning"
                        showIcon
                        message="账号已被封禁"
                        style={{marginBottom: 16}}
                    />
                ) : null}

                <Form<ProfileForm>
                    layout="vertical"
                    initialValues={{
                        name: user.name,
                        phone: user.phone ?? '',
                        wechat: user.wechat ?? '',
                        qq: user.qq ?? '',
                        email: user.email ?? '',
                    }}
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        name="name"
                        label="姓名"
                        rules={[
                            {required: true, message: '请输入姓名'},
                            {max: TEXT_LIMIT.short, message: `不超过 ${TEXT_LIMIT.short} 字`},
                        ]}
                    >
                        <Input placeholder="姓名"/>
                    </Form.Item>

                    <Form.Item
                        name="phone"
                        label="手机号"
                        rules={[
                            {pattern: /^1\d{10}$/, message: '手机号格式不正确'},
                        ]}
                    >
                        <Input placeholder="手机号" inputMode="numeric" maxLength={11}/>
                    </Form.Item>

                    <Form.Item
                        name="wechat"
                        label="微信号"
                        rules={[
                            {max: TEXT_LIMIT.short, message: `不超过 ${TEXT_LIMIT.short} 字`},
                        ]}
                    >
                        <Input placeholder="微信号"/>
                    </Form.Item>

                    <Form.Item
                        name="qq"
                        label="QQ 号"
                        rules={[{pattern: /^\d{0,20}$/, message: 'QQ 号必须是数字'}]}
                    >
                        <Input placeholder="QQ 号" inputMode="numeric" maxLength={20}/>
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="邮箱"
                        rules={[{type: 'email', message: '邮箱格式不正确'}]}
                    >
                        <Input placeholder="邮箱"/>
                    </Form.Item>

                    <Form.Item style={{marginBottom: 0}}>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined/>} loading={submitting}>
                            保存
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </Space>
    );
}
