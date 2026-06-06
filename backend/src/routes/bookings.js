const express = require('express');
const { prisma } = require('../prisma');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const router = express.Router();

router.get('/', async (req, res) => {
  const { userId, status, date } = req.query;
  const where = {};
  if (userId) where.userId = parseInt(userId);
  if (status) where.status = status;

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      user: true,
      session: { include: { room: true } },
      players: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json(bookings);
});

router.get('/:id', async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      user: true,
      session: { include: { room: true } },
      players: true,
    },
  });
  if (!booking) return res.status(404).json({ error: '预约不存在' });
  res.json(booking);
});

router.get('/qrcode/:bookingNo', async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { bookingNo: req.params.bookingNo },
    include: { session: { include: { room: true } } },
  });
  if (!booking) return res.status(404).json({ error: '预约不存在' });
  res.json(booking);
});

router.post('/', async (req, res) => {
  const { sessionId, playerCount, bookingType, userId, players, phone } = req.body;

  const session = await prisma.session.findUnique({ where: { id: parseInt(sessionId) } });
  if (!session) return res.status(404).json({ error: '场次不存在' });

  const available = session.maxCapacity - session.bookedCount;
  if (playerCount > available) {
    return res.status(400).json({ error: `场次余票不足，剩余 ${available} 个名额` });
  }

  let user;
  if (userId) {
    user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
  }
  if (!user) {
    user = await prisma.user.create({
      data: { phone: phone || `temp_${Date.now()}`, nickname: '游客' },
    });
  }

  const bookingNo = `BK${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  const totalAmount = parseFloat(session.price) * playerCount;

  const qrData = JSON.stringify({ bookingNo, sessionId, timestamp: Date.now() });
  const qrCode = await QRCode.toDataURL(qrData);

  const booking = await prisma.booking.create({
    data: {
      bookingNo,
      userId: user.id,
      sessionId: parseInt(sessionId),
      playerCount,
      bookingType: bookingType || 'online',
      totalAmount,
      qrCode,
      status: 'confirmed',
      paidAt: new Date(),
      players: {
        create: players?.map(p => ({
          name: p.name,
          phone: p.phone,
          idCard: p.idCard,
        })) || [],
      },
    },
    include: { session: { include: { room: true } }, players: true },
  });

  await prisma.session.update({
    where: { id: parseInt(sessionId) },
    data: { bookedCount: { increment: playerCount } },
  });

  res.status(201).json(booking);
});

router.post('/:id/checkin', async (req, res) => {
  const { employeeId } = req.body;
  const booking = await prisma.booking.update({
    where: { id: parseInt(req.params.id) },
    data: {
      status: 'checked_in',
      checkedInAt: new Date(),
      checkedInBy: employeeId ? parseInt(employeeId) : null,
    },
    include: { session: { include: { room: true } }, user: true },
  });
  res.json(booking);
});

router.post('/:id/cancel', async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(req.params.id) },
  });
  if (!booking) return res.status(404).json({ error: '预约不存在' });

  await prisma.booking.update({
    where: { id: parseInt(req.params.id) },
    data: { status: 'cancelled' },
  });

  await prisma.session.update({
    where: { id: booking.sessionId },
    data: { bookedCount: { decrement: booking.playerCount } },
  });

  res.json({ message: '取消成功' });
});

module.exports = router;
