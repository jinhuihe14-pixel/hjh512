const express = require('express');
const { prisma } = require('../prisma');
const dayjs = require('dayjs');
const asyncHandler = require('../utils/asyncHandler');
const router = express.Router();

router.get('/rules', asyncHandler(async (req, res) => {
  const [commissionRules, attendanceRules] = await Promise.all([
    prisma.commissionRule.findMany({ where: { isActive: true } }),
    prisma.attendanceRule.findMany({ where: { isActive: true } }),
  ]);
  res.json({ commissionRules, attendanceRules });
}));

router.get('/', asyncHandler(async (req, res) => {
  const { month, employeeId } = req.query;
  const where = {};
  if (month) where.month = month;
  if (employeeId) where.employeeId = parseInt(employeeId);

  const payrolls = await prisma.payroll.findMany({
    where,
    include: { employee: true },
    orderBy: { month: 'desc' },
  });
  res.json(payrolls);
}));

router.get('/calculate', asyncHandler(async (req, res) => {
  const { month } = req.query;
  if (!month) return res.status(400).json({ error: '请指定月份' });

  const startDate = dayjs(month).startOf('month').toDate();
  const endDate = dayjs(month).endOf('month').toDate();

  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    include: { npcAssignments: true },
  });

  const [ticketCommissionRule, npcCommissionRule, snackCommissionRule, attendanceRule] = await Promise.all([
    prisma.commissionRule.findFirst({ where: { ruleType: 'ticket', isActive: true } }),
    prisma.commissionRule.findFirst({ where: { ruleType: 'npc', isActive: true } }),
    prisma.commissionRule.findFirst({ where: { ruleType: 'snack', isActive: true } }),
    prisma.attendanceRule.findFirst({ where: { isActive: true } }),
  ]);

  const results = [];

  for (const employee of employees) {
    const shifts = await prisma.shift.findMany({
      where: {
        employeeId: employee.id,
        shiftDate: { gte: startDate, lte: endDate },
      },
      include: { snackSales: true },
    });

    const npcCount = await prisma.npcAssignment.count({
      where: {
        employeeId: employee.id,
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        employeeId: employee.id,
        recordDate: { gte: startDate, lte: endDate },
      },
    });

    const ticketSalesTotal = shifts.length * 1000;

    const ticketCommission = employee.position === '前台'
      ? ticketSalesTotal * (parseFloat(ticketCommissionRule?.rate || 0) / 100)
      : 0;

    const npcBonus = employee.position === 'NPC'
      ? npcCount * parseFloat(npcCommissionRule?.fixedAmount || 0)
      : 0;

    const snackSalesTotal = shifts.reduce((sum, shift) => {
      return sum + shift.snackSales.reduce((s, sale) => s + parseFloat(sale.totalAmount), 0);
    }, 0);

    const snackCommission = employee.position === '前台'
      ? snackSalesTotal * (parseFloat(snackCommissionRule?.rate || 0) / 100)
      : 0;

    const workDays = attendanceRecords.filter(r => r.status === 'normal').length;
    const attendanceBonus = workDays >= (attendanceRule?.fullDays || 26)
      ? parseFloat(attendanceRule?.bonusAmount || 0)
      : 0;

    const lateDays = attendanceRecords.filter(r => r.status === 'late').length;
    const deductions = lateDays * parseFloat(attendanceRule?.latePenalty || 0);

    const totalAmount = parseFloat(employee.baseSalary)
      + ticketCommission
      + npcBonus
      + snackCommission
      + attendanceBonus
      - deductions;

    results.push({
      employee,
      month,
      baseSalary: parseFloat(employee.baseSalary),
      ticketCommission,
      npcBonus,
      npcCount,
      snackCommission,
      snackSalesTotal,
      attendanceBonus,
      workDays,
      deductions,
      totalAmount,
    });
  }

  res.json(results);
}));

router.post('/generate', asyncHandler(async (req, res) => {
  const { month } = req.body;
  const calculations = await getPayrollCalculations(month);

  const payrolls = [];
  for (const calc of calculations) {
    const existing = await prisma.payroll.findFirst({
      where: { employeeId: calc.employee.id, month },
    });

    if (!existing) {
      const payroll = await prisma.payroll.create({
        data: {
          employeeId: calc.employee.id,
          month,
          baseSalary: calc.baseSalary,
          ticketCommission: calc.ticketCommission,
          npcBonus: calc.npcBonus,
          snackCommission: calc.snackCommission,
          attendanceBonus: calc.attendanceBonus,
          deductions: calc.deductions,
          totalAmount: calc.totalAmount,
          status: 'draft',
        },
        include: { employee: true },
      });
      payrolls.push(payroll);
    } else {
      payrolls.push(existing);
    }
  }

  res.json(payrolls);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const { otherBonus, deductions, remark } = req.body;

  const payroll = await prisma.payroll.findUnique({
    where: { id: parseInt(req.params.id) },
  });

  const totalAmount = parseFloat(payroll.baseSalary)
    + parseFloat(payroll.ticketCommission)
    + parseFloat(payroll.npcBonus)
    + parseFloat(payroll.snackCommission)
    + parseFloat(payroll.attendanceBonus)
    + parseFloat(otherBonus || payroll.otherBonus)
    - parseFloat(deductions || payroll.deductions);

  const updated = await prisma.payroll.update({
    where: { id: parseInt(req.params.id) },
    data: {
      otherBonus: otherBonus !== undefined ? parseFloat(otherBonus) : payroll.otherBonus,
      deductions: deductions !== undefined ? parseFloat(deductions) : payroll.deductions,
      remark: remark !== undefined ? remark : payroll.remark,
      totalAmount,
    },
    include: { employee: true },
  });

  res.json(updated);
}));

router.post('/:id/lock', asyncHandler(async (req, res) => {
  const payroll = await prisma.payroll.update({
    where: { id: parseInt(req.params.id) },
    data: {
      status: 'locked',
      lockedAt: new Date(),
    },
    include: { employee: true },
  });
  res.json(payroll);
}));

async function getPayrollCalculations(month) {
  const startDate = dayjs(month).startOf('month').toDate();
  const endDate = dayjs(month).endOf('month').toDate();

  const employees = await prisma.employee.findMany({ where: { isActive: true } });

  const [ticketCommissionRule, npcCommissionRule, snackCommissionRule, attendanceRule] = await Promise.all([
    prisma.commissionRule.findFirst({ where: { ruleType: 'ticket', isActive: true } }),
    prisma.commissionRule.findFirst({ where: { ruleType: 'npc', isActive: true } }),
    prisma.commissionRule.findFirst({ where: { ruleType: 'snack', isActive: true } }),
    prisma.attendanceRule.findFirst({ where: { isActive: true } }),
  ]);

  const results = [];

  for (const employee of employees) {
    const shifts = await prisma.shift.findMany({
      where: { employeeId: employee.id, shiftDate: { gte: startDate, lte: endDate } },
      include: { snackSales: true },
    });

    const npcCount = await prisma.npcAssignment.count({
      where: { employeeId: employee.id, createdAt: { gte: startDate, lte: endDate } },
    });

    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { employeeId: employee.id, recordDate: { gte: startDate, lte: endDate } },
    });

    const ticketCommission = employee.position === '前台'
      ? shifts.length * 1000 * (parseFloat(ticketCommissionRule?.rate || 0) / 100)
      : 0;

    const npcBonus = employee.position === 'NPC'
      ? npcCount * parseFloat(npcCommissionRule?.fixedAmount || 0)
      : 0;

    const snackSalesTotal = shifts.reduce((sum, shift) => {
      return sum + shift.snackSales.reduce((s, sale) => s + parseFloat(sale.totalAmount), 0);
    }, 0);

    const snackCommission = employee.position === '前台'
      ? snackSalesTotal * (parseFloat(snackCommissionRule?.rate || 0) / 100)
      : 0;

    const workDays = attendanceRecords.filter(r => r.status === 'normal').length;
    const attendanceBonus = workDays >= (attendanceRule?.fullDays || 26)
      ? parseFloat(attendanceRule?.bonusAmount || 0)
      : 0;

    const lateDays = attendanceRecords.filter(r => r.status === 'late').length;
    const deductions = lateDays * parseFloat(attendanceRule?.latePenalty || 0);

    const totalAmount = parseFloat(employee.baseSalary)
      + ticketCommission
      + npcBonus
      + snackCommission
      + attendanceBonus
      - deductions;

    results.push({
      employee,
      month,
      baseSalary: parseFloat(employee.baseSalary),
      ticketCommission,
      npcBonus,
      npcCount,
      snackCommission,
      snackSalesTotal,
      attendanceBonus,
      workDays,
      deductions,
      totalAmount,
    });
  }

  return results;
}

module.exports = router;
