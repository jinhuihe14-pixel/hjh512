import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import request from '../../utils/request';
import './index.scss';

function OrderDetail() {
  const [booking, setBooking] = useState(null);
  const [refundInfo, setRefundInfo] = useState(null);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [rescheduleInfo, setRescheduleInfo] = useState(null);

  useEffect(() => {
    const { id } = Taro.getCurrentInstance().router.params;
    loadBooking(id);
  }, []);

  const loadBooking = async (id) => {
    try {
      const data = await request({ url: `/bookings/${id}` });
      setBooking(data);
      if (data && data.status === 'confirmed') {
        loadRefundInfo(id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const loadRefundInfo = async (bookingId) => {
    try {
      const data = await request({
        url: '/refund-reschedule/calculate-refund',
        method: 'POST',
        data: { bookingId },
      });
      setRefundInfo(data);
    } catch (error) {
      console.error('获取退款信息失败', error);
    }
  };

  const handleRefund = async () => {
    if (!booking || !refundInfo?.refundable) return;

    Taro.showModal({
      title: '确认退票',
      content: `退票后将退还 ¥${refundInfo.refundAmount} 元，手续费 ¥${refundInfo.serviceFee} 元，确定要退票吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await request({
              url: '/refund-reschedule/refund',
              method: 'POST',
              data: {
                bookingId: booking.id,
                userId: booking.userId,
                reason: '顾客自助退票',
              },
            });

            Taro.showToast({
              title: '退票成功',
              icon: 'success',
            });

            loadBooking(booking.id);
          } catch (error) {
            Taro.showToast({
              title: error?.data?.error || '退票失败',
              icon: 'none',
            });
          }
        }
      },
    });
  };

  const handleReschedule = async () => {
    if (!booking) return;

    try {
      Taro.showLoading({ title: '加载中' });
      const data = await request({
        url: '/refund-reschedule/reschedule/available-sessions',
        method: 'POST',
        data: { bookingId: booking.id },
      });
      Taro.hideLoading();

      setAvailableSessions(data.availableSessions || []);
      setShowRescheduleModal(true);
    } catch (error) {
      Taro.hideLoading();
      Taro.showToast({
        title: '获取可改签场次失败',
        icon: 'none',
      });
    }
  };

  const handleSelectSession = async (session) => {
    setSelectedSession(session);
    try {
      Taro.showLoading({ title: '计算差价' });
      const data = await request({
        url: '/refund-reschedule/reschedule/calculate',
        method: 'POST',
        data: {
          bookingId: booking.id,
          newSessionId: session.id,
        },
      });
      Taro.hideLoading();
      setRescheduleInfo(data);

      const diffText = data.priceDifference > 0
        ? `需要补差价 ¥${Math.abs(data.priceDifference)}`
        : data.priceDifference < 0
          ? `退还差价 ¥${Math.abs(data.priceDifference)}`
          : '无差价';

      Taro.showModal({
        title: '确认改签',
        content: `改签到 ${session.room?.name} ${session.startTime}，${diffText}，确定改签吗？`,
        success: async (res) => {
          if (res.confirm) {
            confirmReschedule(session.id);
          }
        },
      });
    } catch (error) {
      Taro.hideLoading();
      Taro.showToast({
        title: '计算差价失败',
        icon: 'none',
      });
    }
  };

  const confirmReschedule = async (newSessionId) => {
    Taro.showLoading({ title: '处理中' });
    request({
      url: '/refund-reschedule/reschedule',
      method: 'POST',
      data: {
        bookingId: booking.id,
        newSessionId,
        userId: booking.userId,
      },
    }).then(() => {
      Taro.hideLoading();
      Taro.showToast({
        title: '改签成功',
        icon: 'success',
      });
      setShowRescheduleModal(false);
      setSelectedSession(null);
      setRescheduleInfo(null);
      loadBooking(booking.id);
    }).catch((error) => {
      Taro.hideLoading();
      Taro.showToast({
        title: error?.data?.error || '改签失败',
        icon: 'none',
      });
    });
  };

  if (!booking) return null;

  const getStatusText = (status) => {
    const map = {
      pending: '待支付',
      confirmed: '待核销',
      checked_in: '已入场',
      completed: '已完成',
      cancelled: '已取消',
      refunded: '已退票',
    };
    return map[status] || status;
  };

  const canRefund = booking.status === 'confirmed' && refundInfo?.refundable;
  const canReschedule = booking.status === 'confirmed';

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <View className="order-detail">
      <View className="status-card">
        <Text className="status-icon">
          {booking.status === 'confirmed' && '🎫'}
          {booking.status === 'checked_in' && '✅'}
          {booking.status === 'completed' && '🎉'}
          {booking.status === 'cancelled' && '❌'}
          {booking.status === 'refunded' && '💰'}
        </Text>
        <Text className="status-text">{getStatusText(booking.status)}</Text>
      </View>

      <View className="qrcode-card">
        {booking.status === 'confirmed' && (
          <View className="qrcode-box">
            <Text className="qrcode-text">📱</Text>
            <Text className="qrcode-hint">到店出示此码核销入场</Text>
            <Text className="booking-code">核销码：{booking.bookingNo}</Text>
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
          <Text className="value">{formatDate(booking.session?.sessionDate)} {booking.session?.startTime}</Text>
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
          <Text className="value">#{booking.bookingNo}</Text>
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

      {booking.status === 'refunded' && (
        <View className="info-card refund-card">
          <View className="card-title">退票信息</View>
          <View className="info-item">
            <Text className="label">退票状态</Text>
            <Text className="value refund-text">已退票</Text>
          </View>
        </View>
      )}

      {canRefund && refundInfo && (
        <View className="info-card refund-hint">
          <Text className="hint-title">💡 退票说明</Text>
          <Text className="hint-text">
            当前可退款 ¥{refundInfo.refundAmount}（{refundInfo.rule?.name}）
          </Text>
          <Text className="hint-text">
            手续费 ¥{refundInfo.serviceFee}
          </Text>
        </View>
      )}

      {booking.status === 'confirmed' && !refundInfo?.refundable && (
        <View className="info-card refund-hint">
          <Text className="hint-title">⚠️ 退票说明</Text>
          <Text className="hint-text">
            {refundInfo?.message || '当前场次不支持退票'}
          </Text>
        </View>
      )}

      {(canRefund || canReschedule) && (
        <View className="action-bar">
          {canReschedule && (
            <Button className="reschedule-btn" onClick={handleReschedule}>
              改签
            </Button>
          )}
          {canRefund && (
            <Button className="refund-btn" onClick={handleRefund}>
              退票
            </Button>
          )}
        </View>
      )}

      {showRescheduleModal && (
        <View className="modal-mask" onClick={() => setShowRescheduleModal(false)}>
          <View className="modal-content" onClick={(e) => e.stopPropagation()}>
            <View className="modal-header">
              <Text className="modal-title">选择改签场次</Text>
              <Text className="modal-close" onClick={() => setShowRescheduleModal(false)}>✕</Text>
            </View>
            <ScrollView className="modal-body" scrollY>
              {availableSessions.length === 0 ? (
                <View className="empty-tip">暂无可改签的场次</View>
              ) : (
                availableSessions.map((session) => (
                  <View
                    key={session.id}
                    className={`session-item ${selectedSession?.id === session.id ? 'selected' : ''}`}
                    onClick={() => handleSelectSession(session)}
                  >
                    <View className="session-room">{session.room?.name}</View>
                    <View className="session-time">
                      {formatDate(session.sessionDate)} {session.startTime}
                    </View>
                    <View className="session-price">¥{session.price}/人</View>
                    <View className="session-seats">
                      剩余 {session.maxCapacity - session.bookedCount} 位
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

export default OrderDetail;
