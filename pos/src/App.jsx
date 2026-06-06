import React, { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import {
  QrcodeOutlined,
  ShoppingCartOutlined,
  CalendarOutlined,
  FileTextOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import CheckIn from './pages/CheckIn.jsx';
import SnackSale from './pages/SnackSale.jsx';
import WalkInBooking from './pages/WalkInBooking.jsx';
import TodaySummary from './pages/TodaySummary.jsx';
import ShiftSelect from './pages/ShiftSelect.jsx';

const { Header, Content, Sider } = Layout;

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();

  if (!currentShift) {
    return <ShiftSelect onShiftSelect={setCurrentShift} />;
  }

  const menuItems = [
    {
      key: '/',
      icon: <QrcodeOutlined />,
      label: '预约核销',
    },
    {
      key: '/snack-sale',
      icon: <ShoppingCartOutlined />,
      label: '商品售卖',
    },
    {
      key: '/walk-in',
      icon: <CalendarOutlined />,
      label: '现场售票',
    },
    {
      key: '/summary',
      icon: <FileTextOutlined />,
      label: '今日汇总',
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
          {collapsed ? '收银' : '前台收银'}
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
            {menuItems.find(m => m.key === location.pathname)?.label || '预约核销'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span><UserOutlined /> {currentShift.employee.name}</span>
          </div>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: colorBgContainer }}>
          <Routes>
            <Route path="/" element={<CheckIn shift={currentShift} />} />
            <Route path="/snack-sale" element={<SnackSale shift={currentShift} />} />
            <Route path="/walk-in" element={<WalkInBooking shift={currentShift} />} />
            <Route path="/summary" element={<TodaySummary shift={currentShift} />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
