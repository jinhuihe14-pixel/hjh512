import React, { useState } from 'react';
import {
  Card,
  Input,
  Button,
  Table,
  Tag,
  message,
  Space,
  Descriptions,
  Modal,
  Select,
} from 'antd';
import {
  QrcodeOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  RollbackOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import request from '../utils/request.js';
import dayjs from 'dayjs';

const { Option } = Select;

function CheckIn({ shift }) {
  const [searchText, setSearchText] = useState('');
  const [booking, setBooking] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [refundInfo, setRefundInfo] = useState(null);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [rescheduleInfo, setRescheduleInfo] = useState(null);
  const [refundReason, setRefundReason] = useState('');

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
        b.session?.room?.name.includes(searchText) ||
        b.user?.phone?.includes(searchText)
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

  const handleRefundClick = async () => {
    if (!booking) return;
    try {
      const data = await request.post('/refund-reschedule/calculate-refund', {
        bookingId: booking.id,
      });
      setRefundInfo(data);
      setRefundModalVisible(true);
      setRefundReason('');
    } catch (error) {
      message.error('获取退款信息失败');
    }
  };

  const handleRefund = async () => {
    if (!booking || !refundInfo?.refundable) return;
    
    try {
      await request.post('/refund-reschedule/refund', {
        bookingId: booking.id,
        employeeId: shift.employeeId,
        reason: refundReason || '前台代客退票',
      });
      
      message.success('退票成功');
      setRefundModalVisible(false);
      setBooking(null);
      setSearchText('');
    } catch (error) {
      message.error(error.response?.data?.error || '退票失败');
    }
  };

  const handleRescheduleClick = async () => {
    if (!booking) return;
    try {
      const data = await request.post('/refund-reschedule/reschedule/available-sessions', {
        bookingId: booking.id,
      });
      setAvailableSessions(data.availableSessions || []);
      setRescheduleModalVisible(true);
      setSelectedSession(null);
      setRescheduleInfo(null);
    } catch (error) {
      message.error('获取可改签场次失败');
    }
  };

  const handleSessionSelect = async (sessionId) => {
    const session = availableSessions.find(s => s.id === sessionId);
    setSelectedSession(session);
    
    try {
      const data = await request.post('/refund-reschedule/reschedule/calculate', {
        bookingId: booking.id,
        newSessionId: sessionId,
      });
      setRescheduleInfo(data);
    } catch (error) {
      message.error('计算差价失败');
    }
  };

  const handleReschedule = async () => {
    if (!booking || !selectedSession) return;
    
    try {
      await request.post('/refund-reschedule/reschedule', {
        bookingId: booking.id,
        newSessionId: selectedSession.id,
        employeeId: shift.employeeId,
      });
      
      message.success('改签成功');
      setRescheduleModalVisible(false);
      setBooking(null);
      setSearchText('');
    } catch (error) {
      message.error(error.response?.data?.error || '改签失败');
    }
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
        const colorMap = { confirmed: 'blue', checked_in: 'green', refunded: 'red', cancelled: 'default' };
        const textMap = { confirmed: '待核销', checked_in: '已核销', refunded: '已退票', cancelled: '已取消' };
        return <Tag color={colorMap[s]}>{textMap[s]}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.status === 'confirmed' && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleCheckIn(record.id)}
              >
                核销
              </Button>
              <Button
                size="small"
                icon={<RollbackOutlined />}
                onClick={() => {
                  setBooking(record);
                  handleRefundClick();
                }}
              >
                退票
              </Button>
              <Button
                size="small"
                icon={<SwapOutlined />}
                onClick={() => {
                  setBooking(record);
                  handleRescheduleClick();
                }}
              >
                改签
              </Button>
            </>
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
                <Space>
                  <Button
                    size="large"
                    icon={<SwapOutlined />}
                    onClick={handleRescheduleClick}
                  >
                    改签
                  </Button>
                  <Button
                    size="large"
                    danger
                    icon={<RollbackOutlined />}
                    onClick={handleRefundClick}
                  >
                    退票
                  </Button>
                  <Button type="primary" size="large" onClick={() => handleCheckIn(booking.id)}>
                    确认核销
                  </Button>
                </Space>
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
                <Tag color={booking.status === 'confirmed' ? 'blue' : booking.status === 'refunded' ? 'red' : 'green'} size="large">
                  {booking.status === 'confirmed' ? '待核销' : booking.status === 'refunded' ? '已退票' : '已核销'}
                </Tag>
              </Descriptions.Item>
              {booking.players?.length > 0 && (
                <Descriptions.Item label="玩家列表" span={2}>
                  {booking.players.map(p => (
                    <Tag key={p.id}>{p.name}</Tag>
                  ))}
                </Descriptions.Item>
              )}
              {booking.user && (
                <>
                  <Descriptions.Item label="用户昵称">
                    {booking.user.nickname || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="联系电话">
                    {booking.user.phone || '-'}
                  </Descriptions.Item>
                </>
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

      <Modal
        title="退票确认"
        open={refundModalVisible}
        onCancel={() => setRefundModalVisible(false)}
        onOk={handleRefund}
        okText="确认退票"
        okButtonProps={{ danger: true }}
        okDisabled={!refundInfo?.refundable}
        width={500}
      >
        {refundInfo && booking && (
          <div>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="预约号">
                {booking.bookingNo}
              </Descriptions.Item>
              <Descriptions.Item label="原金额">
                ¥{booking.totalAmount.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="退票类型">
                {refundInfo.rule?.name}
              </Descriptions.Item>
              <Descriptions.Item label="退款金额">
                <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                  ¥{refundInfo.refundAmount?.toFixed(2)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="手续费">
                <span style={{ color: '#ff4d4f' }}>
                  ¥{refundInfo.serviceFee?.toFixed(2)}
                </span>
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', marginBottom: 8 }}>退票原因：</label>
              <Input.TextArea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="请输入退票原因（可选）"
                rows={3}
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="改签选择场次"
        open={rescheduleModalVisible}
        onCancel={() => setRescheduleModalVisible(false)}
        onOk={handleReschedule}
        okText="确认改签"
        okButtonProps={{ disabled: !selectedSession }}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <span style={{ color: '#666' }}>当前订单：{booking?.session?.room?.name} </span>
          <span style={{ color: '#666' }}>
            {booking ? `${dayjs(booking.session?.sessionDate).format('MM-DD')} ${booking.session?.startTime}` : ''}
          </span>
          <span style={{ color: '#ff6b6b', marginLeft: 8 }}>
            {booking ? `¥${booking.totalAmount}/ ${booking.playerCount}人` : ''}
          </span>
        </div>

        <Select
          style={{ width: '100%', marginBottom: 16 }}
          placeholder="选择新场次"
          value={selectedSession?.id}
          onChange={handleSessionSelect}
          showSearch
          optionFilterProp="children"
        >
          {availableSessions.map(session => (
            <Option key={session.id} value={session.id}>
              {session.room?.name} - {dayjs(session.sessionDate).format('MM-DD')} {session.startTime} - ¥{session.price}/人 - 剩余{session.maxCapacity - session.bookedCount}位
            </Option>
          ))}
        </Select>

        {rescheduleInfo && (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="新场次">
              {selectedSession?.room?.name} {dayjs(selectedSession?.sessionDate).format('MM-DD')} {selectedSession?.startTime}
            </Descriptions.Item>
            <Descriptions.Item label="原总价">
              ¥{rescheduleInfo.oldTotal?.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="新总价">
              ¥{rescheduleInfo.newTotal?.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="差价">
              {rescheduleInfo.priceDifference > 0 ? (
                <span style={{ color: '#ff4d4f' }}>
                  需补差价 +¥{rescheduleInfo.priceDifference.toFixed(2)}
                </span>
              ) : rescheduleInfo.priceDifference < 0 ? (
                <span style={{ color: '#52c41a' }}>
                  退还差价 ¥{Math.abs(rescheduleInfo.priceDifference).toFixed(2)}
                </span>
              ) : (
                <span style={{ color: '#999' }}>无差价</span>
              )}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

export default CheckIn;
