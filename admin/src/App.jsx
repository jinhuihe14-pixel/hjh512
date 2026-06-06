import React, { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import {
  DashboardOutlined,
  HomeOutlined,
  CalendarOutlined,
  TeamOutlined,
  ShoppingOutlined,
  DollarOutlined,
  BarChartOutlined,
  SettingOutlined,
  RollbackOutlined,
  FundOutlined,
} from '@ant-design/icons';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import RoomManagement from './pages/RoomManagement.jsx';
import SessionManagement from './pages/SessionManagement.jsx';
import BookingManagement from './pages/BookingManagement.jsx';
import EmployeeManagement from './pages/EmployeeManagement.jsx';
import SnackManagement from './pages/SnackManagement.jsx';
import PayrollManagement from './pages/PayrollManagement.jsx';
import Statistics from './pages/Statistics.jsx';
import RefundRescheduleRecords from './pages/RefundRescheduleRecords.jsx';
import RefundRuleManagement from './pages/RefundRuleManagement.jsx';

const { Header, Content, Sider } = Layout;

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '数据概览',
    },
    {
      key: '/rooms',
      icon: <HomeOutlined />,
      label: '密室管理',
    },
    {
      key: '/sessions',
      icon: <CalendarOutlined />,
      label: '场次管理',
    },
    {
      key: '/bookings',
      icon: <ShoppingOutlined />,
      label: '预约管理',
    },
    {
      key: '/employees',
      icon: <TeamOutlined />,
      label: '员工管理',
    },
    {
      key: '/snacks',
      icon: <ShoppingOutlined />,
      label: '商品管理',
    },
    {
      key: '/payroll',
      icon: <DollarOutlined />,
      label: '薪资核算',
    },
    {
      key: '/statistics',
      icon: <BarChartOutlined />,
      label: '数据分析',
    },
    {
      key: '/refund-records',
      icon: <RollbackOutlined />,
      label: '退票改签记录',
    },
    {
      key: '/refund-rules',
      icon: <FundOutlined />,
      label: '退款规则配置',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? 14 : 18,
          fontWeight: 'bold',
        }}>
          {collapsed ? '密室' : '密室逃脱管理'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{
          padding: '0 24px',
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 style={{ margin: 0 }}>
            {menuItems.find(m => m.key === location.pathname)?.label || '数据概览'}
          </h2>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: colorBgContainer, borderRadius: borderRadiusLG }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/rooms" element={<RoomManagement />} />
            <Route path="/sessions" element={<SessionManagement />} />
            <Route path="/bookings" element={<BookingManagement />} />
            <Route path="/employees" element={<EmployeeManagement />} />
            <Route path="/snacks" element={<SnackManagement />} />
            <Route path="/payroll" element={<PayrollManagement />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/refund-records" element={<RefundRescheduleRecords />} />
            <Route path="/refund-rules" element={<RefundRuleManagement />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
