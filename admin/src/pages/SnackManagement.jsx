import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm, InputNumber, Tag, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import request from '../utils/request.js';

function SnackManagement() {
  const [snacks, setSnacks] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSnack, setEditingSnack] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadSnacks();
  }, []);

  const loadSnacks = async () => {
    const data = await request.get('/snacks');
    setSnacks(data);
  };

  const handleAdd = () => {
    setEditingSnack(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (snack) => {
    setEditingSnack(snack);
    form.setFieldsValue(snack);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    await request.delete(`/snacks/${id}`);
    message.success('删除成功');
    loadSnacks();
  };

  const handleSubmit = async (values) => {
    if (editingSnack) {
      await request.put(`/snacks/${editingSnack.id}`, values);
      message.success('更新成功');
    } else {
      await request.post('/snacks', values);
      message.success('添加成功');
    }
    setModalVisible(false);
    loadSnacks();
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: cat => <Tag color={cat === '饮品' ? 'blue' : 'orange'}>{cat}</Tag>,
    },
    { title: '价格', dataIndex: 'price', key: 'price', render: v => `¥${v}` },
    { title: '库存', dataIndex: 'stock', key: 'stock' },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: v => <Tag color={v ? 'green' : 'red'}>{v ? '上架' : '下架'}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} danger size="small">删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ marginBottom: 16 }}>
        添加商品
      </Button>

      <Table columns={columns} dataSource={snacks} rowKey="id" />

      <Modal
        title={editingSnack ? '编辑商品' : '添加商品'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="饮品">饮品</Select.Option>
              <Select.Option value="零食">零食</Select.Option>
              <Select.Option value="周边">周边</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="price" label="价格" rules={[{ required: true }]}>
            <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="stock" label="库存">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
              保存
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default SnackManagement;
