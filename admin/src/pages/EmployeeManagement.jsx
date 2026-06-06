import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm, DatePicker, InputNumber, Tag, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import request from '../utils/request.js';
import dayjs from 'dayjs';

function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    const data = await request.get('/employees');
    setEmployees(data);
  };

  const handleAdd = () => {
    setEditingEmployee(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (emp) => {
    setEditingEmployee(emp);
    form.setFieldsValue({
      ...emp,
      hireDate: dayjs(emp.hireDate),
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    await request.delete(`/employees/${id}`);
    message.success('删除成功');
    loadEmployees();
  };

  const handleSubmit = async (values) => {
    const data = {
      ...values,
      hireDate: values.hireDate.format('YYYY-MM-DD'),
    };
    if (editingEmployee) {
      await request.put(`/employees/${editingEmployee.id}`, data);
      message.success('更新成功');
    } else {
      await request.post('/employees', data);
      message.success('添加成功');
    }
    setModalVisible(false);
    loadEmployees();
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    {
      title: '岗位',
      dataIndex: 'position',
      key: 'position',
      render: pos => {
        const colorMap = { '前台': 'blue', 'NPC': 'purple', '保洁': 'green' };
        return <Tag color={colorMap[pos]}>{pos}</Tag>;
      },
    },
    { title: '基本工资', dataIndex: 'baseSalary', key: 'baseSalary', render: v => `¥${v}` },
    {
      title: '入职日期',
      dataIndex: 'hireDate',
      key: 'hireDate',
      render: v => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: v => <Tag color={v ? 'green' : 'red'}>{v ? '在职' : '离职'}</Tag>,
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
        添加员工
      </Button>

      <Table columns={columns} dataSource={employees} rowKey="id" />

      <Modal
        title={editingEmployee ? '编辑员工' : '添加员工'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="idCard" label="身份证号">
            <Input />
          </Form.Item>
          <Form.Item name="position" label="岗位" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="前台">前台</Select.Option>
              <Select.Option value="NPC">NPC</Select.Option>
              <Select.Option value="保洁">保洁</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="baseSalary" label="基本工资" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="hireDate" label="入职日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
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

export default EmployeeManagement;
