import React, { useState } from 'react';
import { Card, Input, Button, Table, Tag, message, Space, Descriptions, Modal } from 'antd';
import { QrcodeOutlined, SearchOutlined, CheckCircleOutlined } from '@ant-design/icons';
import request from '../utils/request.js';
import dayjs from 'dayjs';

function CheckIn({ shift }) {
  const [searchText, setSearchText] = useState('');
  const [booking, setBooking] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [detailVisible, setDetailVisible] = useState(false);

  const handleSearch = async () => {
    if (!searchText) return;
    
    if (searchText.startsWith('BK')) {
      try {
        const data = await request.get(`/bookings/qrcode/${searchText}`);
        if (data) {
          setBooking(data);
          setSearchResults([]);
        }
      } catch {
        message.error('未找到预约');
      }
    } else {
      const bookings = await request.get('/bookings');
      const filtered = bookings.filter(b => 
        b.bookingNo.includes(searchText) ||
        b.session?.room?.name.includes(searchText)
      );
      setSearchResults(filtered.slice(0, 10));
      setBooking(null);
    }
  };

  const handleCheckIn = async (id) => {
    try {
      await request.post(`/bookings/${id}/checkin`, {
        employeeId: shift.employeeId,
      });
      message.success('核销成功');
      setBooking(null);
      setSearchText('');
    } catch (error) {
      message.error('核销失败');
    }
  };

  const handleSelectResult = (b) => {
    setBooking(b);
    setSearchResults([]);
  };

  const columns = [
    { title: '预约号', dataIndex: 'bookingNo', key: 'bookingNo' },
    { title: '密室', dataIndex: ['session', 'room', 'name'], key: 'room' },
    {
      title: '场次',
      key: 'session',
      render: (_, r) => `${dayjs(r.session.sessionDate).format('MM-DD')} ${r.session.startTime}`,
    },
    { title: '人数', dataIndex: 'playerCount', key: 'playerCount' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: s => {
        const colorMap = { confirmed: 'blue', checked_in: 'green' };
        const textMap = { confirmed: '待核销', checked_in: '已核销' };
        return <Tag color={colorMap[s]}>{textMap[s]}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.status === 'confirmed' && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleCheckIn(record.id)}
            >
              核销
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title="预约核销">
        <Space.Compact style={{ width: '100%', marginBottom: 24 }}>
          <Input
            size="large"
            placeholder="输入预约号或扫描二维码"
            prefix={<QrcodeOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
          />
          <Button type="primary" size="large" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
        </Space.Compact>

        {booking && (
          <Card
            type="inner"
            title="预约信息"
            style={{ marginBottom: 16, border: '2px solid #1890ff', borderRadius: 8 }}
            extra={
              booking.status === 'confirmed' && (
                <Button type="primary" size="large" onClick={() => handleCheckIn(booking.id)}>
                  确认核销
                </Button>
              )
            }
          >
            <Descriptions column={2}>
              <Descriptions.Item label="预约号">{booking.bookingNo}</Descriptions.Item>
              <Descriptions.Item label="密室">{booking.session?.room?.name}</Descriptions.Item>
              <Descriptions.Item label="日期">
                {dayjs(booking.session?.sessionDate).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="时间">{booking.session?.startTime}</Descriptions.Item>
              <Descriptions.Item label="人数">{booking.playerCount}人</Descriptions.Item>
              <Descriptions.Item label="金额">¥{booking.totalAmount}</Descriptions.Item>
              <Descriptions.Item label="状态" span={2}>
                <Tag color={booking.status === 'confirmed' ? 'blue' : 'green'} size="large">
                  {booking.status === 'confirmed' ? '待核销' : '已核销'}
                </Tag>
              </Descriptions.Item>
              {booking.players?.length > 0 && (
                <Descriptions.Item label="玩家列表" span={2}>
                  {booking.players.map(p => (
                    <Tag key={p.id}>{p.name}</Tag>
                  ))}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        )}

        {searchResults.length > 0 && (
          <Table
            columns={columns}
            dataSource={searchResults}
            rowKey="id"
            onRow={(record) => ({
              onClick: () => handleSelectResult(record),
              style: { cursor: 'pointer' },
            })}
            pagination={false}
          />
        )}
      </Card>
    </div>
  );
}

export default CheckIn;
