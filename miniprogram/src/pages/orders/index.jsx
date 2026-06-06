import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import request from '../../utils/request';
import './index.scss';

function Orders() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const onShow = () => {
    loadBookings();
  };

  const onPullDownRefresh = () => {
    loadBookings();
  };

  const loadBookings = async () => {
    try {
      const data = await request({ url: '/bookings' });
      setBookings(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  };

  const goToDetail = (id) => {
    Taro.navigateTo({
      url: `/pages/order-detail/index?id=${id}`,
    });
  };

  const getStatusText = (status) => {
    const map = {
      pending: '待核销',
      checked_in: '已入场',
      completed: '已完成',
      cancelled: '已取消',
    };
    return map[status] || status;
  };

  const getStatusClass = (status) => {
    const map = {
      pending: 'status-pending',
      checked_in: 'status-checked',
      completed: 'status-completed',
      cancelled: 'status-cancelled',
    };
    return map[status] || '';
  };

  return (
    <View className="orders-page">
      <ScrollView scrollY className="order-list">
        {bookings.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-icon">📋</Text>
            <Text className="empty-text">暂无订单</Text>
          </View>
        ) : (
          bookings.map((booking) => (
            <View 
              key={booking.id} 
              className="order-card"
              onClick={() => goToDetail(booking.id)}
            >
              <View className="order-header">
                <Text className="order-id">订单#{booking.id}</Text>
                <Text className={`order-status ${getStatusClass(booking.status)}`}>
                  {getStatusText(booking.status)}
                </Text>
              </View>
              <View className="order-body">
                <View className="order-item">
                  <Text className="label">密室</Text>
                  <Text className="value">{booking.session?.room?.name || '未知'}</Text>
                </View>
                <View className="order-item">
                  <Text className="label">场次</Text>
                  <Text className="value">
                    {booking.session?.date} {booking.session?.startTime}
                  </Text>
                </View>
                <View className="order-item">
                  <Text className="label">人数</Text>
                  <Text className="value">{booking.playerCount}人</Text>
                </View>
              </View>
              <View className="order-footer">
                <Text className="order-amount">¥{booking.totalAmount}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

export default Orders;
