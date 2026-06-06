import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Select, message, DatePicker, InputNumber, Tag, Space, Card, Descriptions } from 'antd';
import { PlusOutlined, LockOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import request from '../utils/request.js';
import dayjs from 'dayjs';

function PayrollManagement() {
  const [payrolls, setPayrolls] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  useEffect(() => {
    loadPayrolls();
  }, []);

  const loadPayrolls = async () => {
    const data = await request.get('/payroll');
    setPayrolls(data);
  };

  const handlePreview = async (month) => {
    const data = await request.get(`/payroll/calculate?month=${month.format('YYYY-MM')}`);
    setPreviewData(data);
    setPreviewVisible(true);
  };

  const handleGenerate = async (month) => {
    await request.post('/payroll/generate', { month: month.format('YYYY-MM') });
    message.success('薪资已生成');
    loadPayrolls();
  };

  const handleEdit = (payroll) => {
    setEditingPayroll(payroll);
    editForm.setFieldsValue({
      otherBonus: payroll.otherBonus,
      deductions: payroll.deductions,
      remark: payroll.remark,
    });
    setEditVisible(true);
  };

  const handleEditSubmit = async (values) => {
    await request.put(`/payroll/${editingPayroll.id}`, values);
    message.success('更新成功');
    setEditVisible(false);
    loadPayrolls();
  };

  const handleLock = async (id) => {
    await request.post(`/payroll/${id}/lock`);
    message.success('账单已锁定');
    loadPayrolls();
  };

  const handleViewDetail = (payroll) => {
    setSelectedPayroll(payroll);
    setDetailVisible(true);
  };

  const columns = [
    { title: '月份', dataIndex: 'month', key: 'month' },
    { title: '员工', dataIndex: ['employee', 'name'], key: 'employee' },
    {
      title: '岗位',
      dataIndex: ['employee', 'position'],
      key: 'position',
      render: pos => <Tag color={pos === '前台' ? 'blue' : 'purple'}>{pos}</Tag>,
    },
    { title: '基本工资', dataIndex: 'baseSalary', key: 'baseSalary', render: v => `¥${v}` },
    { title: '售票提成', dataIndex: 'ticketCommission', key: 'ticketCommission', render: v => `¥${v.toFixed(2)}` },
    { title: 'NPC补助', dataIndex: 'npcBonus', key: 'npcBonus', render: v => `¥${v.toFixed(2)}` },
    { title: '零食提成', dataIndex: 'snackCommission', key: 'snackCommission', render: v => `¥${v.toFixed(2)}` },
    { title: '实发工资', dataIndex: 'totalAmount', key: 'totalAmount', render: v => `¥${v.toFixed(2)}` },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: s => <Tag color={s === 'locked' ? 'green' : 'orange'}>{s === 'locked' ? '已锁定' : '草稿'}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => handleViewDetail(record)}>详情</Button>
          {record.status === 'draft' && (
            <>
              <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>调整</Button>
              <Button icon={<LockOutlined />} type="primary" size="small" onClick={() => handleLock(record.id)}>锁定</Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const previewColumns = [
    { title: '员工', dataIndex: ['employee', 'name'], key: 'employee' },
    { title: '岗位', dataIndex: ['employee', 'position'], key: 'position' },
    { title: '基本工资', dataIndex: 'baseSalary', key: 'baseSalary', render: v => `¥${v}` },
    { title: '售票提成', dataIndex: 'ticketCommission', key: 'ticketCommission', render: v => `¥${v.toFixed(2)}` },
    { title: 'NPC补助', dataIndex: 'npcBonus', key: 'npcBonus', render: v => `¥${v.toFixed(2)}` },
    { title: '零食提成', dataIndex: 'snackCommission', key: 'snackCommission', render: v => `¥${v.toFixed(2)}` },
    { title: '全勤奖', dataIndex: 'attendanceBonus', key: 'attendanceBonus', render: v => `¥${v.toFixed(2)}` },
    { title: '扣款', dataIndex: 'deductions', key: 'deductions', render: v => `¥${v.toFixed(2)}` },
    { title: '总计', dataIndex: 'totalAmount', key: 'totalAmount', render: v => `¥${v.toFixed(2)}` },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <DatePicker.MonthPicker placeholder="选择月份" onChange={(date) => date && handlePreview(date)} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          const month = dayjs();
          handleGenerate(month);
        }}>
          生成本月薪资
        </Button>
      </Space>

      <Table columns={columns} dataSource={payrolls} rowKey="id" />

      <Modal
        title="薪资预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={1200}
      >
        <Table columns={previewColumns} dataSource={previewData} rowKey={r => r.employee.id} pagination={false} />
      </Modal>

      <Modal
        title="调整薪资"
        open={editVisible}
        onCancel={() => setEditVisible(false)}
        footer={null}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item name="otherBonus" label="其他奖金">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="deductions" label="其他扣款">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
              保存
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {detailVisible && selectedPayroll && (
        <Modal
          title="薪资详情"
          open={detailVisible}
          onCancel={() => setDetailVisible(false)}
          footer={null}
        >
          <Descriptions column={1} bordered>
            <Descriptions.Item label="员工">{selectedPayroll.employee.name}</Descriptions.Item>
            <Descriptions.Item label="月份">{selectedPayroll.month}</Descriptions.Item>
            <Descriptions.Item label="基本工资">¥{selectedPayroll.baseSalary}</Descriptions.Item>
            <Descriptions.Item label="售票提成">¥{selectedPayroll.ticketCommission.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="NPC带队补助">¥{selectedPayroll.npcBonus.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="零食销售提成">¥{selectedPayroll.snackCommission.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="全勤奖">¥{selectedPayroll.attendanceBonus.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="其他奖金">¥{selectedPayroll.otherBonus.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="扣款">¥{selectedPayroll.deductions.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="实发工资">
              <strong style={{ fontSize: 18, color: '#1890ff' }}>¥{selectedPayroll.totalAmount.toFixed(2)}</strong>
            </Descriptions.Item>
            {selectedPayroll.remark && (
              <Descriptions.Item label="备注">{selectedPayroll.remark}</Descriptions.Item>
            )}
          </Descriptions>
        </Modal>
      )}
    </div>
  );
}

export default PayrollManagement;
