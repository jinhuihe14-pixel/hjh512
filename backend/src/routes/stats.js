const express = require('express');
const { prisma } = require('../prisma');
const dayjs = require('dayjs');
const asyncHandler = require('../utils/asyncHandler');
const router = express.Router();

router.get('/overview', asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate) : dayjs().subtract(30, 'day').toDate();
  const end = endDate ? new Date(endDate) : new Date();

  const [bookings, snackSales, rooms, refundRecords] = await Promise.all([
    prisma.booking.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { session: { include: { room: true } } },
    }),
    prisma.snackSale.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { items: true },
    }),
    prisma.room.findMany({ where: { isActive: true } }),
    prisma.refundRecord.findMany({
      where: { createdAt: { gte: start, lte: end } },
    }),
  ]);

  const totalTicketRevenue = bookings.reduce((sum, b) => sum + parseFloat(b.totalAmount), 0);
  const totalSnackRevenue = snackSales.reduce((sum, s) => sum + parseFloat(s.totalAmount), 0);
  const totalRefund = refundRecords.reduce((sum, r) => sum + parseFloat(r.refundAmount), 0);
  const totalServiceFee = refundRecords.reduce((sum, r) => sum + parseFloat(r.serviceFee), 0);

  const roomStats = {};
  rooms.forEach(room => {
    roomStats[room.id] = {
      roomId: room.id,
      roomName: room.name,
      bookingCount: 0,
      playerCount: 0,
      revenue: 0,
      refundAmount: 0,
    };
  });

  bookings.forEach(booking => {
    if (roomStats[booking.session.roomId] && booking.status !== 'cancelled' && booking.status !== 'refunded') {
      roomStats[booking.session.roomId].bookingCount++;
      roomStats[booking.session.roomId].playerCount += booking.playerCount;
      roomStats[booking.session.roomId].revenue += parseFloat(booking.totalAmount);
    }
  });

  refundRecords.forEach(refund => {
    const booking = bookings.find(b => b.id === refund.bookingId);
    if (booking && roomStats[booking.session.roomId]) {
      roomStats[booking.session.roomId].refundAmount += parseFloat(refund.refundAmount);
    }
  });

  const validBookings = bookings.filter(b => b.status !== 'cancelled' && b.status !== 'refunded');

  res.json({
    period: { start, end },
    totalBookings: validBookings.length,
    totalPlayers: validBookings.reduce((sum, b) => sum + b.playerCount, 0),
    totalTicketRevenue,
    totalSnackRevenue,
    totalRefund,
    totalServiceFee,
    netTicketRevenue: totalTicketRevenue - totalRefund,
    totalRevenue: totalTicketRevenue + totalSnackRevenue - totalRefund,
    snackSalesCount: snackSales.length,
    refundCount: refundRecords.length,
    roomStats: Object.values(roomStats),
  });
}));

router.get('/room-revenue', asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate) : dayjs().startOf('month').toDate();
  const end = endDate ? new Date(endDate) : new Date();

  const [bookings, refundRecords] = await Promise.all([
    prisma.booking.findMany({
      where: { createdAt: { gte: start, lte: end }, status: { notIn: ['cancelled', 'refunded'] } },
      include: { session: { include: { room: true } } },
    }),
    prisma.refundRecord.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { booking: { include: { session: { include: { room: true } } } } },
    }),
  ]);

  const roomRevenue = {};
  bookings.forEach(booking => {
    const roomId = booking.session.roomId;
    if (!roomRevenue[roomId]) {
      roomRevenue[roomId] = {
        roomId,
        roomName: booking.session.room.name,
        totalRevenue: 0,
        bookingCount: 0,
        playerCount: 0,
        refundAmount: 0,
        netRevenue: 0,
      };
    }
    roomRevenue[roomId].totalRevenue += parseFloat(booking.totalAmount);
    roomRevenue[roomId].bookingCount++;
    roomRevenue[roomId].playerCount += booking.playerCount;
  });

  refundRecords.forEach(refund => {
    const roomId = refund.booking.session.roomId;
    if (roomRevenue[roomId]) {
      roomRevenue[roomId].refundAmount += parseFloat(refund.refundAmount);
    } else if (refund.booking.session.room) {
      roomRevenue[roomId] = {
        roomId,
        roomName: refund.booking.session.room.name,
        totalRevenue: 0,
        bookingCount: 0,
        playerCount: 0,
        refundAmount: parseFloat(refund.refundAmount),
        netRevenue: 0,
      };
    }
  });

  Object.values(roomRevenue).forEach(room => {
    room.netRevenue = room.totalRevenue - room.refundAmount;
  });

  res.json(Object.values(roomRevenue));
}));

router.get('/daily-trend', asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const data = [];

  for (let i = parseInt(days) - 1; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day');
    const start = date.startOf('day').toDate();
    const end = date.endOf('day').toDate();

    const [bookings, snackSales, refundRecords] = await Promise.all([
      prisma.booking.findMany({
        where: { createdAt: { gte: start, lte: end }, status: { notIn: ['cancelled', 'refunded'] } },
      }),
      prisma.snackSale.findMany({
        where: { createdAt: { gte: start, lte: end } },
      }),
      prisma.refundRecord.findMany({
        where: { createdAt: { gte: start, lte: end } },
      }),
    ]);

    const ticketRevenue = bookings.reduce((sum, b) => sum + parseFloat(b.totalAmount), 0);
    const snackRevenue = snackSales.reduce((sum, s) => sum + parseFloat(s.totalAmount), 0);
    const refundAmount = refundRecords.reduce((sum, r) => sum + parseFloat(r.refundAmount), 0);

    data.push({
      date: date.format('YYYY-MM-DD'),
      weekday: date.day(),
      bookingCount: bookings.length,
      playerCount: bookings.reduce((sum, b) => sum + b.playerCount, 0),
      ticketRevenue,
      snackRevenue,
      refundAmount,
      netTicketRevenue: ticketRevenue - refundAmount,
      totalRevenue: ticketRevenue + snackRevenue - refundAmount,
    });
  }

  res.json(data);
}));

router.get('/monthly-comparison', asyncHandler(async (req, res) => {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const date = dayjs().subtract(i, 'month');
    const start = date.startOf('month').toDate();
    const end = date.endOf('month').toDate();

    const [bookings, snackSales, refundRecords] = await Promise.all([
      prisma.booking.findMany({
        where: { createdAt: { gte: start, lte: end }, status: { notIn: ['cancelled', 'refunded'] } },
      }),
      prisma.snackSale.findMany({
        where: { createdAt: { gte: start, lte: end } },
      }),
      prisma.refundRecord.findMany({
        where: { createdAt: { gte: start, lte: end } },
      }),
    ]);

    const ticketRevenue = bookings.reduce((sum, b) => sum + parseFloat(b.totalAmount), 0);
    const snackRevenue = snackSales.reduce((sum, s) => sum + parseFloat(s.totalAmount), 0);
    const refundAmount = refundRecords.reduce((sum, r) => sum + parseFloat(r.refundAmount), 0);

    months.push({
      month: date.format('YYYY-MM'),
      bookingCount: bookings.length,
      playerCount: bookings.reduce((sum, b) => sum + b.playerCount, 0),
      ticketRevenue,
      snackRevenue,
      refundAmount,
      netTicketRevenue: ticketRevenue - refundAmount,
      totalRevenue: ticketRevenue + snackRevenue - refundAmount,
    });
  }

  res.json(months);
}));

router.get('/peak-hours', asyncHandler(async (req, res) => {
  const sessions = await prisma.session.findMany({
    include: { bookings: true },
  });

  const hourStats = {};
  sessions.forEach(session => {
    const hour = parseInt(session.startTime.split(':')[0]);
    if (!hourStats[hour]) {
      hourStats[hour] = { hour, bookingCount: 0, playerCount: 0 };
    }
    session.bookings.forEach(booking => {
      if (booking.status !== 'cancelled') {
        hourStats[hour].bookingCount++;
        hourStats[hour].playerCount += booking.playerCount;
      }
    });
  });

  const result = Object.values(hourStats).sort((a, b) => b.bookingCount - a.bookingCount);
  res.json(result);
}));

module.exports = router;
