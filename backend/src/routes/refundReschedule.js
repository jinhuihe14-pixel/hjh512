const express = require('express');
const { prisma } = require('../prisma');
const dayjs = require('dayjs');
const asyncHandler = require('../utils/asyncHandler');
const router = express.Router();

async function getRefundRule(sessionDate, startTime) {
  const sessionDateTime = dayjs(`${dayjs(sessionDate).format('YYYY-MM-DD')} ${startTime}`);
  const now = dayjs();
  const hoursDiff = sessionDateTime.diff(now, 'hour', true);

  const rules = await prisma.refundRule.findMany({
    where: { isActive: true },
    orderBy: { minHours: 'desc' },
  });

  for (const rule of rules) {
    if (rule.maxHours === null) {
      if (hoursDiff >= rule.minHours) {
        return rule;
      }
    } else {
      if (hoursDiff >= rule.minHours && hoursDiff < rule.maxHours) {
        return rule;
      }
    }
  }

  return null;
}

function calculateRefundAmount(totalAmount, refundRate) {
  const refundAmount = parseFloat((totalAmount * refundRate / 100).toFixed(2));
  const serviceFee = parseFloat((totalAmount - refundAmount).toFixed(2));
  return { refundAmount, serviceFee };
}

router.get('/refund-rules', asyncHandler(async (req, res) => {
  const rules = await prisma.refundRule.findMany({
    where: { isActive: true },
    orderBy: { minHours: 'desc' },
  });
  res.json(rules);
}));

router.get('/refund-rules/all', asyncHandler(async (req, res) => {
  const rules = await prisma.refundRule.findMany({
    orderBy: { minHours: 'desc' },
  });
  res.json(rules);
}));

router.post('/refund-rules', asyncHandler(async (req, res) => {
  const { name, minHours, maxHours, refundRate, description } = req.body;

  const rule = await prisma.refundRule.create({
    data: {
      name,
      minHours: parseFloat(minHours),
      maxHours: maxHours !== null && maxHours !== undefined ? parseFloat(maxHours) : null,
      refundRate: parseFloat(refundRate),
      description,
    },
  });

  res.status(201).json(rule);
}));

router.put('/refund-rules/:id', asyncHandler(async (req, res) => {
  const { name, minHours, maxHours, refundRate, description, isActive } = req.body;

  const rule = await prisma.refundRule.update({
    where: { id: parseInt(req.params.id) },
    data: {
      name,
      minHours: parseFloat(minHours),
      maxHours: maxHours !== null && maxHours !== undefined ? parseFloat(maxHours) : null,
      refundRate: parseFloat(refundRate),
      description,
      isActive: isActive !== undefined ? isActive : undefined,
    },
  });

  res.json(rule);
}));

router.delete('/refund-rules/:id', asyncHandler(async (req, res) => {
  await prisma.refundRule.delete({
    where: { id: parseInt(req.params.id) },
  });
  res.json({ message: '删除成功' });
}));

router.post('/calculate-refund', asyncHandler(async (req, res) => {
  const { bookingId } = req.body;

  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(bookingId) },
    include: { session: true },
  });

  if (!booking) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (booking.status !== 'confirmed') {
    return res.status(400).json({ error: '只有待核销的订单才能申请退票' });
  }

  const rule = await getRefundRule(booking.session.sessionDate, booking.session.startTime);

  if (!rule || rule.refundRate === 0) {
    return res.json({
      refundable: false,
      message: '当前时间不支持退票',
      rule: rule || null,
      refundAmount: 0,
      serviceFee: booking.totalAmount,
      originalAmount: booking.totalAmount,
    });
  }

  const { refundAmount, serviceFee } = calculateRefundAmount(booking.totalAmount, rule.refundRate);

  res.json({
    refundable: true,
    rule,
    refundAmount,
    serviceFee,
    originalAmount: booking.totalAmount,
  });
}));

router.post('/refund', asyncHandler(async (req, res) => {
  const { bookingId, userId, employeeId, reason } = req.body;

  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(bookingId) },
    include: { session: true },
  });

  if (!booking) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (booking.status !== 'confirmed') {
    return res.status(400).json({ error: '只有待核销的订单才能退票' });
  }

  if (booking.status === 'refunded') {
    return res.status(400).json({ error: '订单已退票' });
  }

  if (userId && booking.userId !== parseInt(userId)) {
    return res.status(403).json({ error: '无权退票他人订单' });
  }

  const rule = await getRefundRule(booking.session.sessionDate, booking.session.startTime);

  if (!rule || rule.refundRate === 0) {
    return res.status(400).json({ error: '当前时间不支持退票' });
  }

  const { refundAmount, serviceFee } = calculateRefundAmount(booking.totalAmount, rule.refundRate);

  const refundNo = `RF${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

  const result = await prisma.$transaction(async (tx) => {
    const updatedBooking = await tx.booking.update({
      where: { id: parseInt(bookingId) },
      data: {
        status: 'refunded',
      },
      include: { session: true },
    });

    await tx.session.update({
      where: { id: booking.sessionId },
      data: {
        bookedCount: {
          decrement: booking.playerCount,
        },
      },
    });

    const refundRecord = await tx.refundRecord.create({
      data: {
        refundNo,
        bookingId: parseInt(bookingId),
        userId: booking.userId,
        employeeId: employeeId ? parseInt(employeeId) : null,
        refundAmount,
        serviceFee,
        originalAmount: booking.totalAmount,
        refundType: rule.name,
        reason: reason || null,
        operatorType: employeeId ? 'employee' : 'customer',
        operatorId: employeeId ? parseInt(employeeId) : booking.userId,
      },
      include: {
        booking: { include: { session: { include: { room: true } } } },
        user: true,
        employee: true,
      },
    });

    return refundRecord;
  });

  res.status(201).json(result);
}));

router.post('/reschedule/available-sessions', asyncHandler(async (req, res) => {
  const { bookingId, roomId } = req.body;

  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(bookingId) },
    include: { session: true },
  });

  if (!booking) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (booking.status !== 'confirmed') {
    return res.status(400).json({ error: '只有待核销的订单才能改签' });
  }

  const now = dayjs();

  const where = {
    status: 'available',
    sessionDate: {
      gte: now.startOf('day').toDate(),
    },
    maxCapacity: {
      gte: booking.playerCount,
    },
  };

  if (roomId) {
    where.roomId = parseInt(roomId);
  }

  const sessions = await prisma.session.findMany({
    where,
    include: { room: true },
    orderBy: [
      { sessionDate: 'asc' },
      { startTime: 'asc' },
    ],
  });

  const availableSessions = sessions.filter(s => {
    const sessionDateTime = dayjs(`${dayjs(s.sessionDate).format('YYYY-MM-DD')} ${s.startTime}`);
    const remaining = s.maxCapacity - s.bookedCount;
    return sessionDateTime.isAfter(now) && remaining >= booking.playerCount && s.id !== booking.sessionId;
  });

  res.json({
    booking,
    availableSessions,
    playerCount: booking.playerCount,
  });
}));

router.post('/reschedule/calculate', asyncHandler(async (req, res) => {
  const { bookingId, newSessionId } = req.body;

  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(bookingId) },
    include: { session: true },
  });

  if (!booking) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (booking.status !== 'confirmed') {
    return res.status(400).json({ error: '只有待核销的订单才能改签' });
  }

  const newSession = await prisma.session.findUnique({
    where: { id: parseInt(newSessionId) },
    include: { room: true },
  });

  if (!newSession) {
    return res.status(404).json({ error: '新场次不存在' });
  }

  const now = dayjs();
  const sessionDateTime = dayjs(`${dayjs(newSession.sessionDate).format('YYYY-MM-DD')} ${newSession.startTime}`);
  if (sessionDateTime.isBefore(now)) {
    return res.status(400).json({ error: '不能选择已开场的场次' });
  }

  const remaining = newSession.maxCapacity - newSession.bookedCount;
  if (remaining < booking.playerCount) {
    return res.status(400).json({ error: `新场次余票不足，剩余 ${remaining} 个名额` });
  }

  const oldTotal = parseFloat(booking.session.price) * booking.playerCount;
  const newTotal = parseFloat(newSession.price) * booking.playerCount;
  const priceDifference = parseFloat((newTotal - oldTotal).toFixed(2));

  res.json({
    oldSession: booking.session,
    newSession,
    playerCount: booking.playerCount,
    oldTotal: parseFloat(oldTotal.toFixed(2)),
    newTotal: parseFloat(newTotal.toFixed(2)),
    priceDifference,
    diffType: priceDifference > 0 ? 'supplement' : (priceDifference < 0 ? 'refund' : 'equal'),
  });
}));

router.post('/reschedule', asyncHandler(async (req, res) => {
  const { bookingId, newSessionId, userId, employeeId } = req.body;

  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(bookingId) },
    include: { session: true },
  });

  if (!booking) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (booking.status !== 'confirmed') {
    return res.status(400).json({ error: '只有待核销的订单才能改签' });
  }

  if (userId && booking.userId !== parseInt(userId)) {
    return res.status(403).json({ error: '无权改签他人订单' });
  }

  const newSession = await prisma.session.findUnique({
    where: { id: parseInt(newSessionId) },
    include: { room: true },
  });

  if (!newSession) {
    return res.status(404).json({ error: '新场次不存在' });
  }

  const now = dayjs();
  const sessionDateTime = dayjs(`${dayjs(newSession.sessionDate).format('YYYY-MM-DD')} ${newSession.startTime}`);
  if (sessionDateTime.isBefore(now)) {
    return res.status(400).json({ error: '不能选择已开场的场次' });
  }

  const oldTotal = parseFloat(booking.session.price) * booking.playerCount;
  const newTotal = parseFloat(newSession.price) * booking.playerCount;
  const priceDifference = parseFloat((newTotal - oldTotal).toFixed(2));

  const rescheduleNo = `RS${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

  const result = await prisma.$transaction(async (tx) => {
    await tx.session.update({
      where: { id: booking.sessionId },
      data: {
        bookedCount: {
          decrement: booking.playerCount,
        },
      },
    });

    const newSessionAfter = await tx.session.update({
      where: { id: parseInt(newSessionId) },
      data: {
        bookedCount: {
          increment: booking.playerCount,
        },
      },
    });

    if (newSessionAfter.bookedCount > newSessionAfter.maxCapacity) {
      throw new Error('新场次余票不足');
    }

    const updatedBooking = await tx.booking.update({
      where: { id: parseInt(bookingId) },
      data: {
        sessionId: parseInt(newSessionId),
        totalAmount: parseFloat(newTotal.toFixed(2)),
      },
      include: { session: { include: { room: true } } },
    });

    const rescheduleRecord = await tx.rescheduleRecord.create({
      data: {
        rescheduleNo,
        bookingId: parseInt(bookingId),
        userId: booking.userId,
        employeeId: employeeId ? parseInt(employeeId) : null,
        oldSessionId: booking.sessionId,
        newSessionId: parseInt(newSessionId),
        oldPrice: parseFloat(booking.session.price),
        newPrice: parseFloat(newSession.price),
        priceDifference,
        playerCount: booking.playerCount,
        operatorType: employeeId ? 'employee' : 'customer',
        operatorId: employeeId ? parseInt(employeeId) : booking.userId,
      },
      include: {
        booking: { include: { session: { include: { room: true } } } },
        user: true,
        employee: true,
        oldSession: { include: { room: true } },
        newSession: { include: { room: true } },
      },
    });

    return { booking: updatedBooking, rescheduleRecord };
  });

  res.status(201).json(result);
}));

router.get('/refund-records', asyncHandler(async (req, res) => {
  const { bookingId, userId, employeeId, startDate, endDate, sessionId } = req.query;

  const where = {};
  if (bookingId) where.bookingId = parseInt(bookingId);
  if (userId) where.userId = parseInt(userId);
  if (employeeId) where.employeeId = parseInt(employeeId);
  if (sessionId) {
    where.booking = {
      sessionId: parseInt(sessionId),
    };
  }
  if (startDate && endDate) {
    where.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  const records = await prisma.refundRecord.findMany({
    where,
    include: {
      booking: { include: { session: { include: { room: true } } } },
      user: true,
      employee: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  res.json(records);
}));

router.get('/reschedule-records', asyncHandler(async (req, res) => {
  const { bookingId, userId, employeeId, startDate, endDate } = req.query;

  const where = {};
  if (bookingId) where.bookingId = parseInt(bookingId);
  if (userId) where.userId = parseInt(userId);
  if (employeeId) where.employeeId = parseInt(employeeId);
  if (startDate && endDate) {
    where.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  const records = await prisma.rescheduleRecord.findMany({
    where,
    include: {
      booking: true,
      user: true,
      employee: true,
      oldSession: { include: { room: true } },
      newSession: { include: { room: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  res.json(records);
}));

router.get('/records', asyncHandler(async (req, res) => {
  const { startDate, endDate, employeeId, type } = req.query;

  const dateFilter = {};
  if (startDate && endDate) {
    dateFilter.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }
  if (employeeId) {
    dateFilter.employeeId = parseInt(employeeId);
  }

  const [refundRecords, rescheduleRecords] = await Promise.all([
    prisma.refundRecord.findMany({
      where: { ...dateFilter },
      include: {
        booking: { include: { session: { include: { room: true } } } },
        user: true,
        employee: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.rescheduleRecord.findMany({
      where: { ...dateFilter },
      include: {
        booking: true,
        user: true,
        employee: true,
        oldSession: { include: { room: true } },
        newSession: { include: { room: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ]);

  const refundItems = refundRecords.map(r => ({
    id: r.id,
    type: 'refund',
    recordNo: r.refundNo,
    bookingId: r.bookingId,
    bookingNo: r.booking.bookingNo,
    user: r.user,
    employee: r.employee,
    session: r.booking.session,
    amount: r.refundAmount,
    serviceFee: r.serviceFee,
    originalAmount: r.originalAmount,
    refundType: r.refundType,
    reason: r.reason,
    operatorType: r.operatorType,
    status: r.status,
    createdAt: r.createdAt,
  }));

  const rescheduleItems = rescheduleRecords.map(r => ({
    id: r.id,
    type: 'reschedule',
    recordNo: r.rescheduleNo,
    bookingId: r.bookingId,
    bookingNo: r.booking.bookingNo,
    user: r.user,
    employee: r.employee,
    oldSession: r.oldSession,
    newSession: r.newSession,
    oldPrice: r.oldPrice,
    newPrice: r.newPrice,
    priceDifference: r.priceDifference,
    playerCount: r.playerCount,
    operatorType: r.operatorType,
    status: r.status,
    createdAt: r.createdAt,
  }));

  const allRecords = [...refundItems, ...rescheduleItems].sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  res.json({
    totalRefund: refundRecords.reduce((sum, r) => sum + r.refundAmount, 0),
    totalServiceFee: refundRecords.reduce((sum, r) => sum + r.serviceFee, 0),
    rescheduleCount: rescheduleRecords.length,
    refundCount: refundRecords.length,
    records: allRecords,
  });
}));

module.exports = router;
