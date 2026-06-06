import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, message, Select, DatePicker, Space, Card, Descriptions, Modal } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons';
import request from '../utils/request.js';
import dayjs from 'dayjs';

function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState();
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    loadBookings();
  }, [statusFilter]);

  const loadBookings = async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.append('status', statusFilter);
    const data = await request.get(`/bookings?${params.toString()}`);
    setBookings(data);
  };

  const handleCheckin = async (id) => {
    await request.post(`/bookings/${id}/checkin`);
    message.success('核销成功');
    loadBookings();
  };

  const handleCancel = async (id) => {
    await request.post(`/bookings/${id}/cancel`);
    message.success('取消成功');
    loadBookings();
  };

  const handleViewDetail = (booking) => {
    setSelectedBooking(booking);
    setDetailVisible(true);
  };

  const columns = [
    { title: '预约号', dataIndex: 'bookingNo', key: 'bookingNo' },
    { title: '密室', dataIndex: ['session', 'room', 'name'], key: 'room' },
    {
      title: '场次时间',
      key: 'sessionTime',
      render: (_, r) => `${dayjs(r.session.sessionDate).format('YYYY-MM-DD')} ${r.session.startTime}`,
    },
    { title: '人数', dataIndex: 'playerCount', key: 'playerCount' },
    { title: '金额', dataIndex: 'totalAmount', key: 'totalAmount', render: v => `¥${v}` },
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
          checked_in: '已核销',
          cancelled: '已取消',
        };
        return <Tag color={colorMap[status]}>{textMap[status]}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: v => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => handleViewDetail(record)}>详情</Button>
          {record.status === 'confirmed' && (
            <>
              <Button icon={<CheckCircleOutlined />} type="primary" size="small" onClick={() => handleCheckin(record.id)}>核销</Button>
              <Button icon={<CloseCircleOutlined />} danger size="small" onClick={() => handleCancel(record.id)}>取消</Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Select
          style={{ width: 150 }}
          placeholder="状态筛选"
          allowClear
          value={statusFilter}
          onChange={setStatusFilter}
        >
          <Select.Option value="pending">待支付</Select.Option>
          <Select.Option value="confirmed">已确认</Select.Option>
          <Select.Option value="checked_in">已核销</Select.Option>
          <Select.Option value="cancelled">已取消</Select.Option>
        </Select>
      </Space>

      <Table columns={columns} dataSource={bookings} rowKey="id" />

      {detailVisible && selectedBooking && (
        <Modal
          title="预约详情"
          open={detailVisible}
          onCancel={() => setDetailVisible(false)}
          footer={null}
          width={600}
        >
          <Descriptions column={1} bordered>
            <Descriptions.Item label="预约号">{selectedBooking.bookingNo}</Descriptions.Item>
            <Descriptions.Item label="密室">{selectedBooking.session?.room?.name}</Descriptions.Item>
            <Descriptions.Item label="场次">
              {dayjs(selectedBooking.session?.sessionDate).format('YYYY-MM-DD')} {selectedBooking.session?.startTime}
            </Descriptions.Item>
            <Descriptions.Item label="玩家人数">{selectedBooking.playerCount}人</Descriptions.Item>
            <Descriptions.Item label="总金额">¥{selectedBooking.totalAmount}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={selectedBooking.status === 'confirmed' ? 'blue' : 'green'}>
                {selectedBooking.status === 'confirmed' ? '已确认' : '已核销'}
              </Tag>
            </Descriptions.Item>
            {selectedBooking.players?.length > 0 && (
              <Descriptions.Item label="玩家列表">
                {selectedBooking.players.map(p => (
                  <div key={p.id}>{p.name} {p.phone}</div>
                ))}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Modal>
      )}
    </div>
  );
}

export default BookingManagement;
