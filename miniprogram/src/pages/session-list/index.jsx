import React from 'react';
import { View, Text } from '@tarojs/components';
import './index.scss';

function SessionList() {
  return (
    <View className="session-list-page">
      <View className="empty-state">
        <Text>场次列表</Text>
      </View>
    </View>
  );
}

export default SessionList;
