import React from 'react';
import { View, Text, Button, Cell, CellGroup } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './index.scss';

function Profile() {
  const goToOrders = () => {
    Taro.switchTab({
      url: '/pages/orders/index',
    });
  };

  const goToAbout = () => {
    Taro.showModal({
      title: '关于我们',
      content: '密室逃脱体验馆\n提供沉浸式密室逃脱体验\n客服电话：400-xxx-xxxx',
      showCancel: false,
    });
  };

  const callService = () => {
    Taro.makePhoneCall({
      phoneNumber: '400-123-4567',
    });
  };

  return (
    <View className="profile-page">
      <View className="user-card">
        <View className="avatar">
          <Text className="avatar-text">👤</Text>
        </View>
        <View className="user-info">
          <Text className="user-name">微信用户</Text>
          <Text className="user-id">ID: 88888888</Text>
        </View>
      </View>

      <View className="stats-card">
        <View className="stat-item">
          <Text className="stat-value">0</Text>
          <Text className="stat-label">已完成</Text>
        </View>
        <View className="stat-item">
          <Text className="stat-value">0</Text>
          <Text className="stat-label">待体验</Text>
        </View>
        <View className="stat-item">
          <Text className="stat-value">0</Text>
          <Text className="stat-label">已取消</Text>
        </View>
      </View>

      <View className="menu-section">
        <CellGroup>
          <Cell
            title="我的订单"
            onClick={goToOrders}
            is-link
          />
          <Cell
            title="联系客服"
            onClick={callService}
            is-link
          />
          <Cell
            title="关于我们"
            onClick={goToAbout}
            is-link
          />
        </CellGroup>
      </View>

      <View className="footer">
        <Text className="version">版本 v1.0.0</Text>
      </View>
    </View>
  );
}

export default Profile;
