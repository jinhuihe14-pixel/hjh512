import React, { useState, useEffect } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import request from '../../utils/request';
import './index.scss';

function OrderDetail() {
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    const { id } = Taro.getCurrentInstance().router.params;
    loadBooking(id);
  }, []);

  const loadBooking = async (id) => {
    try {
      const data = await request({ url: `/bookings/${id}` });
      setBooking(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCancel = async () => {
    if (!booking) return;
    
    Taro.showModal({
      title: '确认取消',
      content: '确定要取消这个预约吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await request({
              url: `/bookings/${booking.id}/cancel`,
              method: 'PUT',
            });
            
            Taro.showToast({
              title: '已取消',
              icon: 'success',
            });
            
            loadBooking(booking.id);
          } catch (error) {
            Taro.showToast({
              title: '取消失败',
              icon: 'none',
            });
          }
        }
      },
    });
  };

  if (!booking) return null;

  const getStatusText = (status) => {
    const map = {
      pending: '待核销',
      checked_in: '已入场',
      completed: '已完成',
      cancelled: '已取消',
    };
    return map[status] || status;
  };

  const canCancel = booking.status === 'pending';

  return (
    <View className="order-detail">
      <View className="status-card">
        <Text className="status-icon">
          {booking.status === 'pending' && '🎫'}
          {booking.status === 'checked_in' && '✅'}
          {booking.status === 'completed' && '🎉'}
          {booking.status === 'cancelled' && '❌'}
        </Text>
        <Text className="status-text">{getStatusText(booking.status)}</Text>
      </View>

      <View className="qrcode-card">
        {booking.status === 'pending' && (
          <View className="qrcode-box">
            <Text className="qrcode-text">📱</Text>
            <Text className="qrcode-hint">到店出示此码核销入场</Text>
            <Text className="booking-code">核销码：{booking.verificationCode}</Text>
          </View>
        )}
      </View>

      <View className="info-card">
        <View className="card-title">场次信息</View>
        <View className="info-item">
          <Text className="label">密室主题</Text>
          <Text className="value">{booking.session?.room?.name}</Text>
        </View>
        <View className="info-item">
          <Text className="label">日期时间</Text>
          <Text className="value">{booking.session?.date} {booking.session?.startTime}</Text>
        </View>
        <View className="info-item">
          <Text className="label">玩家人数</Text>
          <Text className="value">{booking.playerCount}人</Text>
        </View>
        <View className="info-item">
          <Text className="label">单价</Text>
          <Text className="value">¥{booking.session?.price}/人</Text>
        </View>
      </View>

      {booking.players && booking.players.length > 0 && (
        <View className="info-card">
          <View className="card-title">玩家信息</View>
          {booking.players.map((player, index) => (
            <View key={index} className="player-info">
              <Text>{player.name}</Text>
              {player.phone && <Text className="phone">{player.phone}</Text>}
            </View>
          ))}
        </View>
      )}

      <View className="info-card">
        <View className="card-title">订单信息</View>
        <View className="info-item">
          <Text className="label">订单编号</Text>
          <Text className="value">#{booking.id}</Text>
        </View>
        <View className="info-item">
          <Text className="label">预约类型</Text>
          <Text className="value">
            {booking.bookingType === 'walk_in' ? '现场购票' : '线上预约'}
          </Text>
        </View>
        <View className="info-item">
          <Text className="label">预约时间</Text>
          <Text className="value">{new Date(booking.createdAt).toLocaleString()}</Text>
        </View>
        <View className="info-item total">
          <Text className="label">订单金额</Text>
          <Text className="value total-value">¥{booking.totalAmount}</Text>
        </View>
      </View>

      {canCancel && (
        <View className="action-bar">
          <Button className="cancel-btn" onClick={handleCancel}>
            取消预约
          </Button>
        </View>
      )}
    </View>
  );
}

export default OrderDetail;
