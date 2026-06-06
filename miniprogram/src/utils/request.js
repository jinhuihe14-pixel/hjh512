import Taro from '@tarojs/taro';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3002/api';

const request = (options) => {
  const { url, method = 'GET', data } = options;

  return new Promise((resolve, reject) => {
    Taro.request({
      url: BASE_URL + url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          Taro.showToast({
            title: '请求失败',
            icon: 'none',
          });
          reject(res);
        }
      },
      fail: (err) => {
        Taro.showToast({
          title: '网络错误',
          icon: 'none',
        });
        reject(err);
      },
    });
  });
};

export default request;
