import React, { useState, useEffect } from 'react';
import { View, Text, Input, Button, Stepper } from '@tarojs/components';
import Taro from '@tarojs/taro';
import request from '../../utils/request';
import './index.scss';

function Booking() {
  const [session, setSession] = useState(null);
  const [playerCount, setPlayerCount] = useState(1);
  const [players, setPlayers] = useState([{ name: '', phone: '' }]);
  const [roomName, setRoomName] = useState('');

  useEffect(() => {
    const params = Taro.getCurrentInstance().router.params;
    setRoomName(params.roomName);
    loadSession(params.sessionId);
  }, []);

  const loadSession = async (sessionId) => {
    try {
      const data = await request({ url: `/sessions` });
      const found = data.find(s => s.id === parseInt(sessionId));
      if (found) setSession(found);
    } catch (error) {
      console.error(error);
    }
  };

  const updatePlayer = (index, field, value) => {
    const updated = [...players];
    updated[index][field] = value;
    setPlayers(updated);
  };

  const handlePlayerCountChange = (value) => {
    const newCount = parseInt(value);
    setPlayerCount(newCount);
    
    if (newCount > players.length) {
      const newPlayers = [...players];
      for (let i = players.length; i < newCount; i++) {
        newPlayers.push({ name: '', phone: '' });
      }
      setPlayers(newPlayers);
    } else {
      setPlayers(players.slice(0, newCount));
    }
  };

  const handleSubmit = async () => {
    if (!session) return;
    
    const validPlayers = players.filter(p => p.name.trim());
    if (validPlayers.length === 0) {
      Taro.showToast({
        title: '请填写玩家信息',
        icon: 'none',
      });
      return;
    }

    try {
      Taro.showLoading({ title: '提交中...' });
      
      const result = await request({
        url: '/bookings',
        method: 'POST',
        data: {
          sessionId: session.id,
          playerCount: validPlayers.length,
          bookingType: 'online',
          phone: validPlayers[0]?.phone,
          players: validPlayers,
        },
      });

      Taro.hideLoading();
      Taro.showToast({
        title: '预约成功',
        icon: 'success',
      });

      setTimeout(() => {
        Taro.redirectTo({
          url: `/pages/order-detail/index?id=${result.id}`,
        });
      }, 1500);
    } catch (error) {
      Taro.hideLoading();
      Taro.showToast({
        title: '预约失败',
        icon: 'none',
      });
    }
  };

  if (!session) return null;

  const totalPrice = session.price * playerCount;
  const available = session.maxCapacity - session.bookedCount;

  return (
    <View className="booking-page">
      <View className="booking-info card">
        <View className="info-row">
          <Text className="label">密室</Text>
          <Text className="value">{roomName}</Text>
        </View>
        <View className="info-row">
          <Text className="label">场次</Text>
          <Text className="value">{session.startTime} - {session.endTime}</Text>
        </View>
        <View className="info-row">
          <Text className="label">单价</Text>
          <Text className="value">¥{session.price}/人</Text>
        </View>
        <View className="info-row">
          <Text className="label">余票</Text>
          <Text className="value highlight">{available}位</Text>
        </View>
      </View>

      <View className="player-section card">
        <View className="section-title">
          <Text>玩家信息</Text>
          <Stepper
            min={1}
            max={available}
            value={playerCount}
            onChange={handlePlayerCountChange}
          />
        </View>
        
        {players.map((player, index) => (
          <View key={index} className="player-item">
            <Text className="player-label">玩家{index + 1}</Text>
            <Input
              className="player-input"
              placeholder="姓名"
              value={player.name}
              onInput={(e) => updatePlayer(index, 'name', e.detail.value)}
            />
            <Input
              className="player-input"
              placeholder="手机号"
              type="number"
              value={player.phone}
              onInput={(e) => updatePlayer(index, 'phone', e.detail.value)}
            />
          </View>
        ))}
      </View>

      <View className="bottom-bar">
        <View className="total-price">
          <Text className="price-label">合计：</Text>
          <Text className="price-value">¥{totalPrice}</Text>
        </View>
        <Button className="submit-btn" onClick={handleSubmit}>
          确认预约
        </Button>
      </View>
    </View>
  );
}

export default Booking;
