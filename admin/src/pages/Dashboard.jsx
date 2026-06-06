import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag } from 'antd';
import {
  DollarOutlined,
  ShoppingOutlined,
  TeamOutlined,
  ScheduleOutlined,
} from '@ant-design/icons';
import request from '../utils/request.js';
import dayjs from 'dayjs';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [overviewData, bookingsData] = await Promise.all([
      request.get('/stats/overview'),
      request.get('/bookings'),
    ]);
    setStats(overviewData);
    setBookings(bookingsData.slice(0, 10));
  };

  const bookingColumns = [
    { title: '预约号', dataIndex: 'bookingNo', key: 'bookingNo' },
    {
      title: '密室',
      dataIndex: ['session', 'room', 'name'],
      key: 'room',
    },
    { title: '人数', dataIndex: 'playerCount', key: 'playerCount' },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: val => `¥${val}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: status => {
        const colorMap = {
          pending: 'orange',
          confirmed: 'blue',
          checked_in: 'green',
          cancelled: 'red',
        };
        const textMap = {
          pending: '待支付',
          confirmed: '已确认',
          checked_in: '已入场',
          cancelled: '已取消',
        };
        return <Tag color={colorMap[status]}>{textMap[status]}</Tag>;
      },
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: val => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
  ];

  return (
    <div>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总营收"
              value={stats?.totalRevenue || 0}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="预约数量"
              value={stats?.totalBookings || 0}
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="玩家数量"
              value={stats?.totalPlayers || 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="零食销售"
              value={stats?.snackSalesCount || 0}
              prefix={<ScheduleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="最近预约">
            <Table
              columns={bookingColumns}
              dataSource={bookings}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
