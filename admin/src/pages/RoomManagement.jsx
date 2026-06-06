import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, Popconfirm, Rate } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import request from '../utils/request.js';

function RoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    const data = await request.get('/rooms');
    setRooms(data);
  };

  const handleAdd = () => {
    setEditingRoom(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    form.setFieldsValue(room);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    await request.delete(`/rooms/${id}`);
    message.success('删除成功');
    loadRooms();
  };

  const handleSubmit = async (values) => {
    if (editingRoom) {
      await request.put(`/rooms/${editingRoom.id}`, values);
      message.success('更新成功');
    } else {
      await request.post('/rooms', values);
      message.success('添加成功');
    }
    setModalVisible(false);
    loadRooms();
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '主题', dataIndex: 'theme', key: 'theme' },
    { title: '难度', dataIndex: 'difficulty', key: 'difficulty', render: d => <Rate disabled value={d} /> },
    { title: '容纳人数', dataIndex: 'capacity', key: 'capacity' },
    { title: '时长(分钟)', dataIndex: 'duration', key: 'duration' },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ marginRight: 8 }}>编辑</Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} danger>删除</Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ marginBottom: 16 }}>
        添加密室
      </Button>

      <Table columns={columns} dataSource={rooms} rowKey="id" />

      <Modal
        title={editingRoom ? '编辑密室' : '添加密室'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="theme" label="主题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="capacity" label="容纳人数" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="difficulty" label="难度" rules={[{ required: true }]}>
            <Rate />
          </Form.Item>
          <Form.Item name="duration" label="时长(分钟)" rules={[{ required: true }]}>
            <InputNumber min={30} step={15} style={{ width: '100%' }} />
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

export default RoomManagement;
