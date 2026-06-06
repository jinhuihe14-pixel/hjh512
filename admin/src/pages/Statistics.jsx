import React, { useEffect, useState } from 'react';
import { Row, Col, Card, DatePicker, Select } from 'antd';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import request from '../utils/request.js';
import dayjs from 'dayjs';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function Statistics() {
  const [dailyTrend, setDailyTrend] = useState([]);
  const [monthlyComparison, setMonthlyComparison] = useState([]);
  const [roomRevenue, setRoomRevenue] = useState([]);
  const [overview, setOverview] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    const [trend, monthly, room, overviewData] = await Promise.all([
      request.get('/stats/daily-trend?days=30'),
      request.get('/stats/monthly-comparison'),
      request.get('/stats/room-revenue'),
      request.get('/stats/overview'),
    ]);
    setDailyTrend(trend);
    setMonthlyComparison(monthly);
    setRoomRevenue(room);
    setOverview(overviewData);
  };

  const pieData = roomRevenue.map(r => ({
    name: r.roomName,
    value: r.totalRevenue,
  }));

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <DatePicker.RangePicker
            onChange={setDateRange}
            placeholder={['开始日期', '结束日期']}
          />
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Card title="密室营收占比" style={{ marginBottom: 16 }}>
            <Row>
              <Col span={12}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `¥${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </Col>
              <Col span={12}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={roomRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="roomName" />
                    <YAxis />
                    <Tooltip formatter={(value) => `¥${value.toFixed(2)}`} />
                    <Legend />
                    <Bar dataKey="totalRevenue" name="营收" fill="#0088FE" />
                    <Bar dataKey="bookingCount" name="场次" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Card title="近30日营收趋势" style={{ marginBottom: 16 }}>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip formatter={(value) => `¥${value.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="ticketRevenue" name="门票收入" stroke="#0088FE" strokeWidth={2} />
                <Line type="monotone" dataKey="snackRevenue" name="零食收入" stroke="#00C49F" strokeWidth={2} />
                <Line type="monotone" dataKey="totalRevenue" name="总收入" stroke="#FF8042" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Card title="近6个月对比">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlyComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `¥${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="ticketRevenue" name="门票收入" fill="#0088FE" />
                <Bar dataKey="snackRevenue" name="零食收入" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Statistics;
