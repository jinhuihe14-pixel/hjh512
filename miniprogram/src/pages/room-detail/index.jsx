import React, { useState, useEffect } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import request from '../../utils/request';
import './index.scss';

function RoomDetail() {
  const [room, setRoom] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const { id } = Taro.getCurrentInstance().router.params;
    loadRoomDetail(id);
    loadSessions(id);
  }, []);

  const loadRoomDetail = async (id) => {
    try {
      const data = await request({ url: `/rooms/${id}` });
      setRoom(data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadSessions = async (roomId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await request({ url: `/sessions?roomId=${roomId}&date=${today}` });
      setSessions(data);
    } catch (error) {
      console.error(error);
    }
  };

  const goToBooking = (session) => {
    Taro.navigateTo({
      url: `/pages/booking/index?sessionId=${session.id}&roomName=${room.name}`,
    });
  };

  if (!room) return null;

  return (
    <View className="room-detail">
      <View className="detail-header">
        <View className="detail-image">
          <Text className="detail-emoji">🎭</Text>
        </View>
        <View className="detail-info">
          <Text className="detail-name">{room.name}</Text>
          <View className="detail-tags">
            <View className="tag">{room.theme}</View>
            <View className="tag">👥 {room.capacity}人</View>
            <View className="tag">⏱️ {room.duration}分钟</View>
          </View>
          <Text className="detail-desc">{room.description}</Text>
        </View>
      </View>

      <View className="session-section">
        <View className="section-title">今日场次</View>
        {sessions.length === 0 ? (
          <View className="empty-sessions">
            <Text>暂无可用场次</Text>
          </View>
        ) : (
          sessions.map((session) => {
            const available = session.maxCapacity - session.bookedCount;
            const isFull = available <= 0;
            
            return (
              <View 
                key={session.id} 
                className={`session-card ${isFull ? 'full' : ''}`}
                onClick={() => !isFull && goToBooking(session)}
              >
                <View className="session-time">
                  <Text className="time-text">{session.startTime}</Text>
                  <Text className="time-sub">- {session.endTime}</Text>
                </View>
                <View className="session-price">
                  <Text className="price-text">¥{session.price}</Text>
                  <Text className="price-sub">/人</Text>
                </View>
                <View className="session-status">
                  {isFull ? (
                    <Text className="status-full">已满</Text>
                  ) : (
                    <Text className="status-available">余{available}位</Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

export default RoomDetail;
