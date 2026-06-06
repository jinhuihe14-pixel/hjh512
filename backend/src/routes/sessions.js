const express = require('express');
const { prisma } = require('../prisma');
const dayjs = require('dayjs');
const asyncHandler = require('../utils/asyncHandler');
const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const { date, roomId } = req.query;
  const where = {};
  
  if (date) {
    const startOfDay = dayjs(date).startOf('day').toDate();
    const endOfDay = dayjs(date).endOf('day').toDate();
    where.sessionDate = { gte: startOfDay, lte: endOfDay };
  }
  if (roomId) where.roomId = parseInt(roomId);

  const sessions = await prisma.session.findMany({
    where,
    include: { room: true, bookings: true, npcAssignments: { include: { employee: true } } },
    orderBy: [{ sessionDate: 'asc' }, { startTime: 'asc' }],
  });
  res.json(sessions);
}));

router.get('/templates', asyncHandler(async (req, res) => {
  const templates = await prisma.sessionTemplate.findMany({
    where: { isActive: true },
    include: { room: true },
  });
  res.json(templates);
}));

router.post('/generate', asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.body;
  const templates = await prisma.sessionTemplate.findMany({ where: { isActive: true } });
  
  const sessions = [];
  let currentDate = dayjs(startDate);
  const end = dayjs(endDate);

  while (currentDate.isBefore(end) || currentDate.isSame(end, 'day')) {
    const weekday = currentDate.day().toString();
    
    for (const template of templates) {
      const templateWeekdays = template.weekdays.split(',');
      if (templateWeekdays.includes(weekday)) {
        const existing = await prisma.session.findFirst({
          where: {
            roomId: template.roomId,
            sessionDate: currentDate.startOf('day').toDate(),
            startTime: template.startTime,
          },
        });
        
        if (!existing) {
          const room = await prisma.room.findUnique({ where: { id: template.roomId } });
          const session = await prisma.session.create({
            data: {
              roomId: template.roomId,
              templateId: template.id,
              sessionDate: currentDate.startOf('day').toDate(),
              startTime: template.startTime,
              endTime: template.endTime,
              price: template.price,
              maxCapacity: room.capacity,
            },
          });
          sessions.push(session);
        }
      }
    }
    currentDate = currentDate.add(1, 'day');
  }

  res.json({ message: `生成了 ${sessions.length} 个场次`, sessions });
}));

router.post('/:id/npc', asyncHandler(async (req, res) => {
  const { employeeId, role } = req.body;
  const assignment = await prisma.npcAssignment.create({
    data: {
      sessionId: parseInt(req.params.id),
      employeeId: parseInt(employeeId),
      role,
    },
    include: { employee: true },
  });
  res.status(201).json(assignment);
}));

router.delete('/npc/:id', asyncHandler(async (req, res) => {
  await prisma.npcAssignment.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ message: '删除成功' });
}));

module.exports = router;
