import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Descriptions } from 'antd';
import {
  DollarOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import request from '../utils/request.js';
import dayjs from 'dayjs';

function TodaySummary({ shift }) {
  const [summary, setSummary] = useState(null);
  const [snackSales, setSnackSales] = useState([]);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    const data = await request.get('/pos/today-summary');
    setSummary(data);
    const salesData = await request.get('/pos/snack-sales');
    setSnackSales(salesData);
  };

  const salesColumns = [
    { title: '单号', dataIndex: 'saleNo', key: 'saleNo' },
    {
      title: '商品',
      key: 'items',
      render: (_, record) => record.items.map(i => `${i.snack.name}×${i.quantity}`).join(', '),
    },
    { title: '金额', dataIndex: 'totalAmount', key: 'totalAmount', render: v => `¥${v}` },
    { title: '提成', dataIndex: 'commission', key: 'commission', render: v => `¥${v.toFixed(2)}` },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: v => dayjs(v).format('HH:mm:ss'),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日总营收"
              value={summary?.totalRevenue || 0}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="门票收入"
              value={summary?.totalTicketRevenue || 0}
              precision={2}
              prefix={<ShoppingOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="零食收入"
              value={summary?.totalSnackRevenue || 0}
              precision={2}
              prefix={<GiftOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="核销人数"
              value={summary?.checkInCount || 0}
              prefix={<CheckCircleOutlined />}
              suffix="人"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="我的提成">
            <Descriptions column={1}>
              <Descriptions.Item label="零食销售提成">
                <span style={{ color: '#52c41a', fontSize: 18, fontWeight: 'bold' }}>
                  ¥{summary?.totalSnackCommission?.toFixed(2) || '0.00'}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="售票笔数">
                {summary?.bookingCount || 0}笔
              </Descriptions.Item>
              <Descriptions.Item label="零食单量">
                {summary?.snackSalesCount || 0}单
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="当班信息">
            <Descriptions column={1}>
              <Descriptions.Item label="员工">{shift?.employee?.name}</Descriptions.Item>
              <Descriptions.Item label="岗位">
                <Tag color="blue">{shift?.employee?.position}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="日期">{dayjs().format('YYYY-MM-DD')}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Card title="零食销售记录" style={{ marginTop: 16 }}>
        <Table
          columns={salesColumns}
          dataSource={snackSales}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}

export default TodaySummary;
