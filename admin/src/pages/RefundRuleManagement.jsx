import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  message,
  Space,
  Popconfirm,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import request from '../utils/request.js';

function RefundRuleManagement() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await request.get('/refund-reschedule/refund-rules/all');
      setRules(data || []);
    } catch (error) {
      message.error('加载退款规则失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRule(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    form.setFieldsValue({
      ...rule,
      maxHours: rule.maxHours || null,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await request.delete(`/refund-reschedule/refund-rules/${id}`);
      message.success('删除成功');
      loadRules();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingRule) {
        await request.put(`/refund-reschedule/refund-rules/${editingRule.id}`, values);
        message.success('更新成功');
      } else {
        await request.post('/refund-reschedule/refund-rules', values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadRules();
    } catch (error) {
      message.error(editingRule ? '更新失败' : '创建失败');
    }
  };

  const toggleStatus = async (rule, checked) => {
    try {
      await request.put(`/refund-reschedule/refund-rules/${rule.id}`, {
        ...rule,
        isActive: checked,
      });
      message.success('状态已更新');
      loadRules();
    } catch (error) {
      message.error('更新失败');
    }
  };

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '时间范围',
      key: 'timeRange',
      render: (_, record) => {
        if (record.maxHours === null) {
          return `开场前 ${record.minHours} 小时以上`;
        }
        return `开场前 ${record.minHours} - ${record.maxHours} 小时`;
      },
      width: 200,
    },
    {
      title: '退款比例',
      dataIndex: 'refundRate',
      key: 'refundRate',
      width: 100,
      render: (rate) => `${rate}%`,
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space>
          <Switch
            size="small"
            checked={record.isActive}
            onChange={(checked) => toggleStatus(record, checked)}
          />
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这条规则吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="退款规则配置"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增规则
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={rules}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      <Modal
        title={editingRule ? '编辑退款规则' : '新增退款规则'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            minHours: 0,
            maxHours: null,
            refundRate: 0,
            isActive: true,
          }}
        >
          <Form.Item
            name="name"
            label="规则名称"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="例如：开场前24小时以上" />
          </Form.Item>

          <Form.Item
            name="minHours"
            label="最小小时数（距开场）"
            rules={[{ required: true, message: '请输入最小小时数' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={1}
              placeholder="例如：24"
            />
          </Form.Item>

          <Form.Item
            name="maxHours"
            label="最大小时数（距开场，null表示无上限）"
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={1}
              placeholder="留空表示无上限"
              allowClear
            />
          </Form.Item>

          <Form.Item
            name="refundRate"
            label="退款比例（%）"
            rules={[{ required: true, message: '请输入退款比例' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={100}
              step={1}
              formatter={(value) => `${value}%`}
              parser={(value) => value.replace('%', '')}
            />
          </Form.Item>

          <Form.Item name="description" label="说明">
            <Input.TextArea rows={3} placeholder="规则说明" />
          </Form.Item>

          <Form.Item name="isActive" label="是否启用" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingRule ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default RefundRuleManagement;
