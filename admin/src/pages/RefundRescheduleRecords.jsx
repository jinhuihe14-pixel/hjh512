import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  DatePicker,
  Select,
  Tag,
  Space,
  Descriptions,
  Modal,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import request from '../utils/request.js';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

function RefundRescheduleRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState(null);
  const [recordType, setRecordType] = useState('all');
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [summary, setSummary] = useState({
    totalRefund: 0,
    totalServiceFee: 0,
    refundCount: 0,
    rescheduleCount: 0,
  });

  useEffect(() => {
    loadRecords();
  }, [dateRange, recordType]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange && dateRange.length === 2) {
        params.append('startDate', dateRange[0].format('YYYY-MM-DD'));
        params.append('endDate', dateRange[1].format('YYYY-MM-DD'));
      }
      if (recordType !== 'all') {
        params.append('type', recordType);
      }

      const data = await request.get(`/refund-reschedule/records?${params.toString()}`);
      setRecords(data.records || []);
      setSummary({
        totalRefund: data.totalRefund || 0,
        totalServiceFee: data.totalServiceFee || 0,
        refundCount: data.refundCount || 0,
        rescheduleCount: data.rescheduleCount || 0,
      });
    } catch (error) {
      console.error('加载记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (record) => {
    setCurrentRecord(record);
    setDetailVisible(true);
  };

  const getTypeTag = (type) => {
    if (type === 'refund') {
      return <Tag color="red">退票</Tag>;
    }
    return <Tag color="orange">改签</Tag>;
  };

  const getOperatorTag = (type) => {
    if (type === 'employee') {
      return <Tag color="blue">前台代办</Tag>;
    }
    return <Tag color="green">顾客自助</Tag>;
  };

  const columns = [
    {
      title: '记录编号',
      dataIndex: 'recordNo',
      key: 'recordNo',
      width: 140,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type) => getTypeTag(type),
    },
    {
      title: '预约号',
      dataIndex: 'bookingNo',
      key: 'bookingNo',
      width: 140,
    },
    {
      title: '用户',
      key: 'user',
      render: (_, record) => record.user?.nickname || record.user?.phone || '-',
      width: 100,
    },
    {
      title: '操作人',
      key: 'operator',
      width: 100,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          {getOperatorTag(record.operatorType)}
          {record.employee?.name && <span>{record.employee.name}</span>}
        </Space>
      ),
    },
    {
      title: '场次信息',
      key: 'session',
      render: (_, record) => {
        if (record.type === 'refund') {
          const session = record.session;
          return (
            <div>
              <div>{session?.room?.name}</div>
              <div style={{ fontSize: 12, color: '#999' }}>
                {session ? `${dayjs(session.sessionDate).format('MM-DD')} ${session.startTime}` : '-'}
              </div>
            </div>
          );
        } else {
          return (
            <div>
              <div style={{ color: '#ff4d4f' }}>
                {record.oldSession?.room?.name} {dayjs(record.oldSession?.sessionDate).format('MM-DD')} {record.oldSession?.startTime}
              </div>
              <div style={{ color: '#52c41a' }}>
                → {record.newSession?.room?.name} {dayjs(record.newSession?.sessionDate).format('MM-DD')} {record.newSession?.startTime}
              </div>
            </div>
          );
        }
      },
    },
    {
      title: '金额',
      key: 'amount',
      width: 120,
      render: (_, record) => {
        if (record.type === 'refund') {
          return (
            <div>
              <div style={{ color: '#ff4d4f' }}>退款: ¥{record.amount?.toFixed(2)}</div>
              <div style={{ fontSize: 12, color: '#999' }}>手续费: ¥{record.serviceFee?.toFixed(2)}</div>
            </div>
          );
        } else {
          const diff = record.priceDifference;
          return (
            <div>
              {diff > 0 ? (
                <div style={{ color: '#ff4d4f' }}>补差: +¥{diff.toFixed(2)}</div>
              ) : diff < 0 ? (
                <div style={{ color: '#52c41a' }}>退差: ¥{Math.abs(diff).toFixed(2)}</div>
              ) : (
                <div style={{ color: '#999' }}>无差价</div>
              )}
              <div style={{ fontSize: 12, color: '#999' }}>
                ¥{record.oldPrice?.toFixed(2)} → ¥{record.newPrice?.toFixed(2)}
              </div>
            </div>
          );
        }
      },
    },
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Space>
          <EyeOutlined
            style={{ cursor: 'pointer', color: '#1890ff' }}
            onClick={() => handleViewDetail(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="退票金额"
              value={summary.totalRefund}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="手续费收入"
              value={summary.totalServiceFee}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="退票次数"
              value={summary.refundCount}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="改签次数"
              value={summary.rescheduleCount}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="退票改签记录">
        <Space style={{ marginBottom: 16 }}>
          <RangePicker
            onChange={setDateRange}
            placeholder={['开始日期', '结束日期']}
          />
          <Select
            style={{ width: 120 }}
            value={recordType}
            onChange={setRecordType}
          >
            <Option value="all">全部</Option>
            <Option value="refund">退票</Option>
            <Option value="reschedule">改签</Option>
          </Select>
          <ReloadOutlined
            style={{ cursor: 'pointer', fontSize: 16 }}
            onClick={loadRecords}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title="详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={600}
      >
        {currentRecord && currentRecord.type === 'refund' && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="记录编号" span={2}>
              {currentRecord.recordNo}
            </Descriptions.Item>
            <Descriptions.Item label="预约号">
              {currentRecord.bookingNo}
            </Descriptions.Item>
            <Descriptions.Item label="类型">
              {getTypeTag(currentRecord.type)}
            </Descriptions.Item>
            <Descriptions.Item label="用户">
              {currentRecord.user?.nickname || currentRecord.user?.phone}
            </Descriptions.Item>
            <Descriptions.Item label="操作方式">
              {getOperatorTag(currentRecord.operatorType)}
            </Descriptions.Item>
            <Descriptions.Item label="操作员工">
              {currentRecord.employee?.name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="场次">
              {currentRecord.session?.room?.name}
            </Descriptions.Item>
            <Descriptions.Item label="时间">
              {dayjs(currentRecord.session?.sessionDate).format('YYYY-MM-DD')} {currentRecord.session?.startTime}
            </Descriptions.Item>
            <Descriptions.Item label="原金额" span={2}>
              ¥{currentRecord.originalAmount?.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="退款金额">
              <span style={{ color: '#ff4d4f' }}>¥{currentRecord.amount?.toFixed(2)}</span>
            </Descriptions.Item>
            <Descriptions.Item label="手续费">
              ¥{currentRecord.serviceFee?.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="退票类型" span={2}>
              {currentRecord.refundType}
            </Descriptions.Item>
            <Descriptions.Item label="退票原因" span={2}>
              {currentRecord.reason || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="操作时间" span={2}>
              {dayjs(currentRecord.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>
        )}

        {currentRecord && currentRecord.type === 'reschedule' && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="记录编号" span={2}>
              {currentRecord.recordNo}
            </Descriptions.Item>
            <Descriptions.Item label="预约号">
              {currentRecord.bookingNo}
            </Descriptions.Item>
            <Descriptions.Item label="类型">
              {getTypeTag(currentRecord.type)}
            </Descriptions.Item>
            <Descriptions.Item label="用户">
              {currentRecord.user?.nickname || currentRecord.user?.phone}
            </Descriptions.Item>
            <Descriptions.Item label="操作方式">
              {getOperatorTag(currentRecord.operatorType)}
            </Descriptions.Item>
            <Descriptions.Item label="操作员工">
              {currentRecord.employee?.name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="原场次" span={2}>
              <div style={{ color: '#ff4d4f' }}>
                {currentRecord.oldSession?.room?.name}
              </div>
              <div style={{ fontSize: 12 }}>
                {dayjs(currentRecord.oldSession?.sessionDate).format('YYYY-MM-DD')} {currentRecord.oldSession?.startTime}
              </div>
              <div style={{ fontSize: 12 }}>
                ¥{currentRecord.oldPrice?.toFixed(2)}/人 × {currentRecord.playerCount}人
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="新场次" span={2}>
              <div style={{ color: '#52c41a' }}>
                {currentRecord.newSession?.room?.name}
              </div>
              <div style={{ fontSize: 12 }}>
                {dayjs(currentRecord.newSession?.sessionDate).format('YYYY-MM-DD')} {currentRecord.newSession?.startTime}
              </div>
              <div style={{ fontSize: 12 }}>
                ¥{currentRecord.newPrice?.toFixed(2)}/人 × {currentRecord.playerCount}人
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="差价" span={2}>
              {currentRecord.priceDifference > 0 ? (
                <span style={{ color: '#ff4d4f' }}>
                  需补差价: +¥{currentRecord.priceDifference.toFixed(2)}
                </span>
              ) : currentRecord.priceDifference < 0 ? (
                <span style={{ color: '#52c41a' }}>
                  退还差价: ¥{Math.abs(currentRecord.priceDifference).toFixed(2)}
                </span>
              ) : (
                <span style={{ color: '#999' }}>无差价</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="操作时间" span={2}>
              {dayjs(currentRecord.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

export default RefundRescheduleRecords;
