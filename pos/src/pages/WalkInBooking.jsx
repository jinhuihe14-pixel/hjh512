import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  TimePicker,
  message,
  Steps,
  Divider,
  Descriptions,
  Tag,
  List,
  Space,
} from 'antd';
import { CalendarOutlined, UserOutlined, PlusOutlined, MinusOutlined, CheckCircleOutlined } from '@ant-design/icons';
import request from '../utils/request.js';
import dayjs from 'dayjs';

const { Step } = Steps;

function WalkInBooking({ shift }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [rooms, setRooms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [players, setPlayers] = useState([{ name: '', phone: '' }]);
  const [form] = Form.useForm();
  const [bookingResult, setBookingResult] = useState(null);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    const data = await request.get('/rooms');
    setRooms(data);
  };

  const handleRoomSelect = async (roomId) => {
    const today = dayjs().format('YYYY-MM-DD');
    const data = await request.get(`/sessions?date=${today}&roomId=${roomId}`);
    setSessions(data.filter(s => s.status === 'available'));
  };

  const handleSessionSelect = (session) => {
    setSelectedSession(session);
    setCurrentStep(1);
  };

  const addPlayer = () => {
    if (players.length >= selectedSession.maxCapacity - selectedSession.bookedCount) {
      message.warning('已达到该场次最大人数');
      return;
    }
    setPlayers([...players, { name: '', phone: '' }]);
  };

  const removePlayer = (index) => {
    if (players.length > 1) {
      setPlayers(players.filter((_, i) => i !== index));
    }
  };

  const updatePlayer = (index, field, value) => {
    const updated = [...players];
    updated[index][field] = value;
    setPlayers(updated);
  };

  const handleSubmit = async () => {
    const validPlayers = players.filter(p => p.name.trim());
    if (validPlayers.length === 0) {
      message.warning('请至少填写一位玩家信息');
      return;
    }

    try {
      const booking = await request.post('/bookings', {
        sessionId: selectedSession.id,
        playerCount: validPlayers.length,
        bookingType: 'walkin',
        phone: validPlayers[0]?.phone,
        players: validPlayers,
      });
      setBookingResult(booking);
      setCurrentStep(2);
      message.success('售票成功');
    } catch (error) {
      message.error('售票失败');
    }
  };

  const handleNewBooking = () => {
    setCurrentStep(0);
    setSelectedSession(null);
    setPlayers([{ name: '', phone: '' }]);
    setSessions([]);
    setBookingResult(null);
    form.resetFields();
  };

  return (
    <div>
      <Card title="现场售票">
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          <Step title="选择场次" icon={<CalendarOutlined />} />
          <Step title="填写信息" icon={<UserOutlined />} />
          <Step title="完成" icon={<CheckCircleOutlined />} />
        </Steps>

        {currentStep === 0 && (
          <div>
            <Form form={form} layout="vertical">
              <Form.Item name="roomId" label="选择密室" rules={[{ required: true }]}>
                <Select
                  placeholder="请选择密室"
                  onChange={handleRoomSelect}
                  style={{ width: 300 }}
                >
                  {rooms.map(room => (
                    <Select.Option key={room.id} value={room.id}>
                      {room.name} - {room.theme}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Form>

            {sessions.length > 0 && (
              <div>
                <Divider orientation="left">可选场次</Divider>
                <Row gutter={[16, 16]}>
                  {sessions.map(session => (
                    <Col key={session.id} xs={24} sm={12} md={8}>
                      <Card
                        hoverable
                        size="small"
                        onClick={() => handleSessionSelect(session)}
                        style={{
                          cursor: 'pointer',
                          border: selectedSession?.id === session.id ? '2px solid #1890ff' : '1px solid #f0f0f0',
                        }}
                      >
                        <Descriptions column={1} size="small">
                          <Descriptions.Item label="时间">{session.startTime}</Descriptions.Item>
                          <Descriptions.Item label="价格">¥{session.price}</Descriptions.Item>
                          <Descriptions.Item label="余票">
                            <Tag color={session.maxCapacity - session.bookedCount > 2 ? 'green' : 'orange'}>
                              {session.maxCapacity - session.bookedCount}张
                            </Tag>
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </div>
        )}

        {currentStep === 1 && selectedSession && (
          <div>
            <Card type="inner" title="场次信息" style={{ marginBottom: 16 }}>
              <Descriptions column={3}>
                <Descriptions.Item label="密室">{selectedSession.room.name}</Descriptions.Item>
                <Descriptions.Item label="时间">
                  {dayjs(selectedSession.sessionDate).format('YYYY-MM-DD')} {selectedSession.startTime}
                </Descriptions.Item>
                <Descriptions.Item label="价格">¥{selectedSession.price}/人</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card type="inner" title="玩家信息">
              <List
                dataSource={players}
                renderItem={(player, index) => (
                  <List.Item
                    actions={[
                      players.length > 1 && (
                        <Button
                          type="text"
                          danger
                          icon={<MinusOutlined />}
                          onClick={() => removePlayer(index)}
                        />
                      ),
                    ]}
                  >
                    <Space style={{ width: '100%' }}>
                      <span style={{ width: 60 }}>玩家{index + 1}</span>
                      <Input
                        placeholder="姓名"
                        value={player.name}
                        onChange={e => updatePlayer(index, 'name', e.target.value)}
                        style={{ width: 150 }}
                      />
                      <Input
                        placeholder="手机号"
                        value={player.phone}
                        onChange={e => updatePlayer(index, 'phone', e.target.value)}
                        style={{ width: 150 }}
                      />
                    </Space>
                  </List.Item>
                )}
              />
              <Button
                type="dashed"
                block
                icon={<PlusOutlined />}
                onClick={addPlayer}
                style={{ marginTop: 16 }}
                disabled={players.length >= selectedSession.maxCapacity - selectedSession.bookedCount}
              >
                添加玩家
              </Button>
            </Card>

            <Divider />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>人数：</strong>{players.filter(p => p.name.trim()).length}人
                <strong style={{ marginLeft: 24 }}>总价：</strong>
                <span style={{ color: '#1890ff', fontSize: 20 }}>
                  ¥{selectedSession.price * players.filter(p => p.name.trim()).length}
                </span>
              </div>
              <Space>
                <Button onClick={() => setCurrentStep(0)}>返回</Button>
                <Button type="primary" onClick={handleSubmit}>确认售票</Button>
              </Space>
            </div>
          </div>
        )}

        {currentStep === 2 && bookingResult && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 24 }} />
            <h3>售票成功</h3>
            <p>预约号：{bookingResult.bookingNo}</p>
            <p>
              {bookingResult.session.room.name} | {dayjs(bookingResult.session.sessionDate).format('YYYY-MM-DD')} {bookingResult.session.startTime}
            </p>
            <p style={{ fontSize: 24, color: '#1890ff' }}>¥{bookingResult.totalAmount}</p>
            <Button type="primary" onClick={handleNewBooking} style={{ marginTop: 16 }}>
              继续售票
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default WalkInBooking;
