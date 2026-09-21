import {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {ArrowLeftOutlined, KeyOutlined, SaveOutlined, StopOutlined, UndoOutlined} from '@ant-design/icons';
import {Button, Card, Descriptions, Form, Input, Popconfirm, Result, Space, Tag,} from 'antd';

import {userApi} from '@/api/user';
import {ApiError} from '@/api/error';
import {LoadingBlock} from '@/components/common/StateBlocks';
import {useAsync} from '@/hooks/useAsync';
import {useIsMobile} from '@/hooks/useIsMobile';
import {type User} from '@/types';
import {ROLE_META, TEXT_LIMIT} from '@/utils/constants';
import {getStaticApi} from '@/utils/antdStatic';
import {formatDateTime} from '@/utils/format';

interface MemberForm {
    name: string;
    phone: string;
    wechat: string;
    qq?: string;
    email?: string;
}

export function MemberDetailPage() {
    const {studentId} = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const [form] = Form.useForm<MemberForm>();
    const [saving, setSaving] = useState(false);

    const member = useAsync(() => userApi.getMember(studentId as string), [studentId], {
        enabled: Boolean(studentId),
    });

    useEffect(() => {
        const data = member.data;
        if (!data) return;
        form.setFieldsValue({
            name: data.name,
            phone: data.phone ?? '',
            wechat: data.wechat ?? '',
            qq: data.qq ?? '',
            email: data.email ?? '',
        });
    }, [member.data, form]);

    const handleSave = async (values: MemberForm) => {
        if (!studentId) return;
        setSaving(true);
        try {
            await userApi.updateMember(studentId, {
                name: values.name.trim(),
                phone: values.phone.trim(),
                wechat: values.wechat.trim(),
                qq: values.qq?.trim() ?? '',
                email: values.email?.trim() ?? '',
            });
            getStaticApi()?.message.success('成员信息已更新');
            member.reload();
        } catch (error) {
            getStaticApi()?.message.error(error instanceof ApiError ? error.message : '保存失败');
        } finally {
            setSaving(false);
        }
    };

    const handleResetPassword = async () => {
        if (!studentId) return;
        try {
            const result = await userApi.resetPassword(studentId);
            getStaticApi()?.message.success(`密码已重置为：${result.initialPassword}`);
            member.reload();
        } catch (error) {
            getStaticApi()?.message.error(error instanceof ApiError ? error.message : '重置失败');
        }
    };

    const handleToggleBan = async (target: User) => {
        try {
            await userApi.setBanned(target.studentId, !target.banned);
            getStaticApi()?.message.success(target.banned ? '已解封该账号' : '已封禁该账号');
            member.reload();
        } catch (error) {
            getStaticApi()?.message.error(error instanceof ApiError ? error.message : '操作失败');
        }
    };

    if (member.loading && !member.data) return <LoadingBlock rows={5}/>;
    if (member.error) {
        return (
            <Result
                status="error"
                title="加载成员信息失败"
                subTitle={member.error.message}
                extra={<Button onClick={member.reload}>重试</Button>}
            />
        );
    }
    const data = member.data;
    if (!data) return null;

    const roleMeta = ROLE_META[data.role];

    return (
        <Space direction="vertical" size={16} style={{width: '100%'}}>
            <Button icon={<ArrowLeftOutlined/>} onClick={() => navigate('/admin/members')}>
                返回成员管理
            </Button>

            <Card title="账号概览">
                <Descriptions column={isMobile ? 1 : 2} size="small" colon={false}>
                    <Descriptions.Item label="学号">{data.studentId}</Descriptions.Item>
                    <Descriptions.Item label="姓名">{data.name || '未命名用户'}</Descriptions.Item>
                    <Descriptions.Item label="角色">
                        <Tag color={roleMeta.color}>{roleMeta.label}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="状态">
                        {data.banned ? <Tag color="red">已封禁</Tag> : <Tag color="green">正常</Tag>}
                        {data.mustChangePassword ? <Tag color="orange">待修改密码</Tag> : null}
                    </Descriptions.Item>
                    <Descriptions.Item label="注册时间">{formatDateTime(data.createdAt)}</Descriptions.Item>
                    <Descriptions.Item label="封禁时间">
                        {data.bannedAt ? formatDateTime(data.bannedAt) : ''}
                    </Descriptions.Item>
                </Descriptions>

                <Space wrap style={{marginTop: 12}}>
                    <Popconfirm
                        title="确认重置该成员密码？"
                        okText="确认重置"
                        cancelText="取消"
                        onConfirm={handleResetPassword}
                    >
                        <Button icon={<KeyOutlined/>}>重置为默认密码</Button>
                    </Popconfirm>

                    <Popconfirm
                        title={data.banned ? '确认解封该账号？' : '确认封禁该账号？'}
                        okText="确认"
                        cancelText="取消"
                        okButtonProps={{danger: !data.banned}}
                        onConfirm={() => handleToggleBan(data)}
                    >
                        <Button
                            danger={!data.banned}
                            icon={data.banned ? <UndoOutlined/> : <StopOutlined/>}
                        >
                            {data.banned ? '解封账号' : '封禁账号'}
                        </Button>
                    </Popconfirm>
                </Space>
            </Card>

            <Card title="联系信息">
                <Form<MemberForm> form={form} layout="vertical" onFinish={handleSave}>
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
                    <Form.Item name="phone" label="手机号"
                               rules={[{pattern: /^\d{0,20}$/, message: '手机号格式不正确'}]}>
                        <Input placeholder="手机号" maxLength={20}/>
                    </Form.Item>
                    <Form.Item
                        name="wechat"
                        label="微信号"
                        rules={[{max: TEXT_LIMIT.short, message: `不超过 ${TEXT_LIMIT.short} 字`}]}
                    >
                        <Input placeholder="微信号"/>
                    </Form.Item>
                    <Form.Item name="qq" label="QQ 号" rules={[{pattern: /^\d{0,20}$/, message: 'QQ 号格式不正确'}]}>
                        <Input placeholder="QQ 号" maxLength={20}/>
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="邮箱"
                        rules={[{type: 'email', message: '邮箱格式不正确'}]}
                    >
                        <Input placeholder="邮箱"/>
                    </Form.Item>
                    <Form.Item style={{marginBottom: 0}}>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined/>} loading={saving}>
                            保存修改
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </Space>
    );
}
