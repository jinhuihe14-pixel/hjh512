import React, { useEffect, useState } from 'react';
import { Card, Select, Button, Form, message, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import request from '../utils/request.js';
import dayjs from 'dayjs';

const { Title } = Typography;

function ShiftSelect({ onShiftSelect }) {
  const [employees, setEmployees] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    const data = await request.get('/employees?position=前台');
    setEmployees(data);
  };

  const handleSubmit = async (values) => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const shift = await request.post('/employees/shifts', {
        employeeId: values.employeeId,
        shiftDate: today,
        shiftType: 'day',
        startTime: dayjs().format('HH:mm'),
        endTime: '22:00',
      });
      const employee = employees.find(e => e.id === values.employeeId);
      onShiftSelect({ ...shift, employee });
      message.success('上班打卡成功');
    } catch (error) {
      message.error('打卡失败');
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0 }}>密室逃脱前台收银</Title>
          <p style={{ color: '#666', marginTop: 8 }}>请选择当班人员</p>
        </div>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="employeeId" label="选择员工" rules={[{ required: true, message: '请选择员工' }]}>
            <Select
              placeholder="请选择当班前台"
              size="large"
              prefix={<UserOutlined />}
            >
              {employees.map(emp => (
                <Select.Option key={emp.id} value={emp.id}>{emp.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" style={{ width: '100%' }}>
              开始上班
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default ShiftSelect;
