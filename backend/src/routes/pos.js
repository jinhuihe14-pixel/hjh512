const express = require('express');
const { prisma } = require('../prisma');
const dayjs = require('dayjs');
const router = express.Router();

router.post('/snack-sale', async (req, res) => {
  const { shiftId, items } = req.body;

  let totalAmount = 0;
  const saleItems = [];

  for (const item of items) {
    const snack = await prisma.snack.findUnique({ where: { id: item.snackId } });
    if (!snack) continue;
    if (snack.stock < item.quantity) {
      return res.status(400).json({ error: `${snack.name} 库存不足` });
    }
    const subtotal = parseFloat(snack.price) * item.quantity;
    totalAmount += subtotal;
    saleItems.push({
      snackId: item.snackId,
      quantity: item.quantity,
      unitPrice: snack.price,
      subtotal,
    });
  }

  const commissionRule = await prisma.commissionRule.findFirst({
    where: { ruleType: 'snack', isActive: true },
  });
  const commission = totalAmount * (parseFloat(commissionRule?.rate || 0) / 100);

  const saleNo = `SS${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

  const sale = await prisma.snackSale.create({
    data: {
      saleNo,
      shiftId: parseInt(shiftId),
      totalAmount,
      commission,
      items: { create: saleItems },
    },
    include: { items: { include: { snack: true } }, shift: { include: { employee: true } } },
  });

  for (const item of items) {
    await prisma.snack.update({
      where: { id: item.snackId },
      data: { stock: { decrement: item.quantity } },
    });
  }

  res.status(201).json(sale);
});

router.get('/snack-sales', async (req, res) => {
  const { shiftId, startDate, endDate } = req.query;
  const where = {};
  if (shiftId) where.shiftId = parseInt(shiftId);
  if (startDate && endDate) {
    where.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  const sales = await prisma.snackSale.findMany({
    where,
    include: { items: { include: { snack: true } }, shift: { include: { employee: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json(sales);
});

router.get('/today-summary', async (req, res) => {
  const { employeeId } = req.query;
  const today = dayjs().startOf('day').toDate();
  const tomorrow = dayjs().add(1, 'day').startOf('day').toDate();

  const shiftWhere = { shiftDate: { gte: today, lt: tomorrow } };
  if (employeeId) shiftWhere.employeeId = parseInt(employeeId);

  const shifts = await prisma.shift.findMany({
    where: shiftWhere,
    include: { employee: true, snackSales: { include: { items: true } } },
  });

  const shiftIds = shifts.map(s => s.id);

  const snackSales = await prisma.snackSale.findMany({
    where: { shiftId: { in: shiftIds } },
  });

  const checkedInBookings = await prisma.booking.findMany({
    where: {
      status: 'checked_in',
      checkedInAt: { gte: today, lt: tomorrow },
    },
  });

  const todayBookings = await prisma.booking.findMany({
    where: {
      createdAt: { gte: today, lt: tomorrow },
    },
  });

  const totalSnackRevenue = snackSales.reduce((sum, s) => sum + parseFloat(s.totalAmount), 0);
  const totalSnackCommission = snackSales.reduce((sum, s) => sum + parseFloat(s.commission), 0);
  const totalTicketRevenue = todayBookings.reduce((sum, b) => sum + parseFloat(b.totalAmount), 0);

  res.json({
    date: today,
    shifts,
    snackSalesCount: snackSales.length,
    totalSnackRevenue,
    totalSnackCommission,
    totalTicketRevenue,
    totalRevenue: totalSnackRevenue + totalTicketRevenue,
    checkInCount: checkedInBookings.length,
    bookingCount: todayBookings.length,
  });
});

module.exports = router;
