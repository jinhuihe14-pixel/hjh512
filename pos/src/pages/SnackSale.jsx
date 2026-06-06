import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Button, List, InputNumber, Space, Statistic, message, Tag, Divider } from 'antd';
import { PlusOutlined, MinusOutlined, DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import request from '../utils/request.js';

function SnackSale({ shift }) {
  const [snacks, setSnacks] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    loadSnacks();
  }, []);

  const loadSnacks = async () => {
    const data = await request.get('/snacks');
    setSnacks(data.filter(s => s.isActive && s.stock > 0));
  };

  const addToCart = (snack) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === snack.id);
      if (existing) {
        if (existing.quantity >= snack.stock) {
          message.warning('库存不足');
          return prev;
        }
        return prev.map(item =>
          item.id === snack.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...snack, quantity: 1 }];
    });
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== id));
    } else {
      const snack = snacks.find(s => s.id === id);
      if (quantity > snack.stock) {
        message.warning('库存不足');
        return;
      }
      setCart(prev =>
        prev.map(item =>
          item.id === id ? { ...item, quantity } : item
        )
      );
    }
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      message.warning('购物车为空');
      return;
    }

    try {
      await request.post('/pos/snack-sale', {
        shiftId: shift.id,
        items: cart.map(item => ({
          snackId: item.id,
          quantity: item.quantity,
        })),
      });
      message.success('销售成功');
      setCart([]);
      loadSnacks();
    } catch (error) {
      message.error('销售失败');
    }
  };

  return (
    <div>
      <Row gutter={24}>
        <Col span={16}>
          <Card title="商品列表">
            <Row gutter={[16, 16]}>
              {snacks.map(snack => (
                <Col key={snack.id} xs={12} sm={8} md={6}>
                  <Card
                    hoverable
                    size="small"
                    onClick={() => addToCart(snack)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>
                        {snack.category === '饮品' ? '🥤' : '🍿'}
                      </div>
                      <div style={{ fontWeight: 'bold' }}>{snack.name}</div>
                      <div style={{ color: '#1890ff', fontSize: 18, margin: '8px 0' }}>
                        ¥{snack.price}
                      </div>
                      <Tag color={snack.stock > 10 ? 'green' : 'orange'}>
                        库存: {snack.stock}
                      </Tag>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            title={
              <span>
                <ShoppingCartOutlined /> 购物车
              </span>
            }
            extra={<Tag color="blue">{cart.length}件商品</Tag>}
          >
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                购物车为空
              </div>
            ) : (
              <>
                <List
                  dataSource={cart}
                  renderItem={item => (
                    <List.Item
                      key={item.id}
                      actions={[
                        <Button
                          type="text"
                          icon={<DeleteOutlined />}
                          danger
                          onClick={() => removeFromCart(item.id)}
                        />,
                      ]}
                    >
                      <List.Item.Meta
                        title={item.name}
                        description={`¥${item.price} × ${item.quantity}`}
                      />
                      <Space>
                        <Button
                          size="small"
                          icon={<MinusOutlined />}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        />
                        <InputNumber
                          size="small"
                          min={1}
                          max={item.stock}
                          value={item.quantity}
                          onChange={val => updateQuantity(item.id, val)}
                          style={{ width: 60 }}
                        />
                        <Button
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        />
                      </Space>
                    </List.Item>
                  )}
                />
                <Divider />
                <Statistic
                  title="合计"
                  value={totalAmount}
                  precision={2}
                  prefix="¥"
                  style={{ marginBottom: 16 }}
                />
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={handleCheckout}
                >
                  结算
                </Button>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default SnackSale;
