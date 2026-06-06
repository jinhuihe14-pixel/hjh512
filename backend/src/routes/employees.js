const express = require('express');
const { prisma } = require('../prisma');
const dayjs = require('dayjs');
const asyncHandler = require('../utils/asyncHandler');
const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const { position, isActive } = req.query;
  const where = {};
  if (position) where.position = position;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const employees = await prisma.employee.findMany({
    where,
    include: {
      shifts: { take: 10, orderBy: { shiftDate: 'desc' } },
    },
  });
  res.json(employees);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const employee = await prisma.employee.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      shifts: true,
      npcAssignments: { include: { session: { include: { room: true } } } },
      attendanceRecords: { take: 30, orderBy: { recordDate: 'desc' } },
    },
  });
  if (!employee) return res.status(404).json({ error: '员工不存在' });
  res.json(employee);
}));

router.post('/', asyncHandler(async (req, res) => {
  const employee = await prisma.employee.create({
    data: {
      name: req.body.name,
      phone: req.body.phone,
      idCard: req.body.idCard,
      position: req.body.position,
      baseSalary: parseFloat(req.body.baseSalary),
      hireDate: new Date(req.body.hireDate),
    },
  });
  res.status(201).json(employee);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (data.baseSalary) data.baseSalary = parseFloat(data.baseSalary);
  if (data.hireDate) data.hireDate = new Date(data.hireDate);

  const employee = await prisma.employee.update({
    where: { id: parseInt(req.params.id) },
    data,
  });
  res.json(employee);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await prisma.employee.update({
    where: { id: parseInt(req.params.id) },
    data: { isActive: false },
  });
  res.json({ message: '已停用' });
}));

router.get('/:id/shifts', asyncHandler(async (req, res) => {
  const { month } = req.query;
  const where = { employeeId: parseInt(req.params.id) };
  
  if (month) {
    const start = dayjs(month).startOf('month').toDate();
    const end = dayjs(month).endOf('month').toDate();
    where.shiftDate = { gte: start, lte: end };
  }

  const shifts = await prisma.shift.findMany({
    where,
    include: { snackSales: true },
    orderBy: { shiftDate: 'desc' },
  });
  res.json(shifts);
}));

router.post('/shifts', asyncHandler(async (req, res) => {
  const { employeeId, shiftDate, shiftType, startTime, endTime } = req.body;
  const shift = await prisma.shift.create({
    data: {
      employeeId: parseInt(employeeId),
      shiftDate: new Date(shiftDate),
      shiftType,
      startTime,
      endTime,
    },
  });
  res.status(201).json(shift);
}));

router.get('/:id/attendance', asyncHandler(async (req, res) => {
  const { month } = req.query;
  const where = { employeeId: parseInt(req.params.id) };
  
  if (month) {
    const start = dayjs(month).startOf('month').toDate();
    const end = dayjs(month).endOf('month').toDate();
    where.recordDate = { gte: start, lte: end };
  }

  const records = await prisma.attendanceRecord.findMany({
    where,
    orderBy: { recordDate: 'desc' },
  });
  res.json(records);
}));

router.post('/attendance', asyncHandler(async (req, res) => {
  const { employeeId, recordDate, type } = req.body;
  const date = dayjs(recordDate).startOf('day').toDate();
  const now = new Date();

  let record = await prisma.attendanceRecord.findFirst({
    where: { employeeId: parseInt(employeeId), recordDate: date },
  });

  if (!record) {
    record = await prisma.attendanceRecord.create({
      data: {
        employeeId: parseInt(employeeId),
        recordDate: date,
        status: 'normal',
      },
    });
  }

  if (type === 'checkin') {
    record = await prisma.attendanceRecord.update({
      where: { id: record.id },
      data: { checkInTime: now },
    });
  } else if (type === 'checkout') {
    record = await prisma.attendanceRecord.update({
      where: { id: record.id },
      data: { checkOutTime: now },
    });
  }

  res.json(record);
}));

module.exports = router;
