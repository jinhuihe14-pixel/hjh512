import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import request from '../../utils/request';
import './index.scss';

function Index() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const data = await request({ url: '/rooms' });
      setRooms(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  };

  const onPullDownRefresh = () => {
    loadRooms();
  };

  const goToDetail = (id) => {
    Taro.navigateTo({
      url: `/pages/room-detail/index?id=${id}`,
    });
  };

  return (
    <View className="index-page">
      <View className="banner">
        <Text className="banner-title">密室逃脱</Text>
        <Text className="banner-subtitle">沉浸式体验 · 烧脑解谜</Text>
      </View>

      <View className="section-title">热门主题</View>
      
      <ScrollView scrollY className="room-list">
        {rooms.map((room) => (
          <View key={room.id} className="room-card" onClick={() => goToDetail(room.id)}>
            <View className="room-image">
              <Text className="room-emoji">🎭</Text>
            </View>
            <View className="room-info">
              <View className="room-header">
                <Text className="room-name">{room.name}</Text>
                <View className="room-theme">{room.theme}</View>
              </View>
              <Text className="room-desc">{room.description || '刺激烧脑的沉浸式体验'}</Text>
              <View className="room-footer">
                <View className="room-meta">
                  <Text>👥 {room.capacity}人</Text>
                  <Text>⏱️ {room.duration}分钟</Text>
                  <Text>⭐ {'★'.repeat(room.difficulty)}</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export default Index;
