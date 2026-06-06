import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Select, DatePicker, message, Tag, Space, InputNumber } from 'antd';
import { PlusOutlined, UserAddOutlined, DeleteOutlined } from '@ant-design/icons';
import request from '../utils/request.js';
import dayjs from 'dayjs';

function SessionManagement() {
  const [sessions, setSessions] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [npcModalVisible, setNpcModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [form] = Form.useForm();
  const [npcForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [sessionsData, roomsData, employeesData] = await Promise.all([
      request.get('/sessions'),
      request.get('/rooms'),
      request.get('/employees'),
    ]);
    setSessions(sessionsData);
    setRooms(roomsData);
    setEmployees(employeesData.filter(e => e.position === 'NPC'));
  };

  const handleGenerate = async (values) => {
    await request.post('/sessions/generate', {
      startDate: values.dateRange[0].format('YYYY-MM-DD'),
      endDate: values.dateRange[1].format('YYYY-MM-DD'),
    });
    message.success('场次生成成功');
    setGenerateModalVisible(false);
    loadData();
  };

  const handleAssignNpc = (session) => {
    setSelectedSession(session);
    npcForm.resetFields();
    setNpcModalVisible(true);
  };

  const handleSubmitNpc = async (values) => {
    await request.post(`/sessions/${selectedSession.id}/npc`, {
      employeeId: values.employeeId,
      role: values.role,
    });
    message.success('NPC分配成功');
    setNpcModalVisible(false);
    loadData();
  };

  const handleRemoveNpc = async (assignmentId) => {
    await request.delete(`/sessions/npc/${assignmentId}`);
    message.success('移除成功');
    loadData();
  };

  const columns = [
    {
      title: '日期',
      dataIndex: 'sessionDate',
      key: 'sessionDate',
      render: val => dayjs(val).format('YYYY-MM-DD'),
    },
    { title: '时间', key: 'time', render: (_, r) => `${r.startTime}-${r.endTime}` },
    { title: '密室', dataIndex: ['room', 'name'], key: 'room' },
    { title: '价格', dataIndex: 'price', key: 'price', render: p => `¥${p}` },
    {
      title: '预约情况',
      key: 'booking',
      render: (_, r) => `${r.bookedCount}/${r.maxCapacity}人`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: s => <Tag color={s === 'available' ? 'green' : 'orange'}>{s === 'available' ? '可预约' : '已满'}</Tag>,
    },
    {
      title: 'NPC',
      key: 'npc',
      render: (_, r) => (
        <Space wrap>
          {r.npcAssignments.map(a => (
            <Tag key={a.id} closable onClose={() => handleRemoveNpc(a.id)}>
              {a.employee.name}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Button icon={<UserAddOutlined />} onClick={() => handleAssignNpc(record)}>
          分配NPC
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setGenerateModalVisible(true)} style={{ marginBottom: 16 }}>
        批量生成场次
      </Button>

      <Table columns={columns} dataSource={sessions} rowKey="id" />

      <Modal
        title="批量生成场次"
        open={generateModalVisible}
        onCancel={() => setGenerateModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleGenerate}>
          <Form.Item name="dateRange" label="选择日期范围" rules={[{ required: true }]}>
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
              生成
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="分配NPC"
        open={npcModalVisible}
        onCancel={() => setNpcModalVisible(false)}
        footer={null}
      >
        <Form form={npcForm} layout="vertical" onFinish={handleSubmitNpc}>
          <Form.Item name="employeeId" label="选择NPC" rules={[{ required: true }]}>
            <Select>
              {employees.map(e => (
                <Select.Option key={e.id} value={e.id}>{e.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="role" label="角色">
            <Select allowClear>
              <Select.Option value="host">主持</Select.Option>
              <Select.Option value="actor">演员</Select.Option>
              <Select.Option value="assistant">协助</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
              确认分配
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default SessionManagement;
