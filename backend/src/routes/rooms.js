const express = require('express');
const { prisma } = require('../prisma');
const router = express.Router();

router.get('/', async (req, res) => {
  const rooms = await prisma.room.findMany({
    where: { isActive: true },
    include: { sessions: { take: 10, orderBy: { sessionDate: 'asc' } } },
  });
  res.json(rooms);
});

router.get('/:id', async (req, res) => {
  const room = await prisma.room.findUnique({
    where: { id: parseInt(req.params.id) },
    include: { sessions: true },
  });
  if (!room) return res.status(404).json({ error: '密室不存在' });
  res.json(room);
});

router.post('/', async (req, res) => {
  const room = await prisma.room.create({
    data: {
      name: req.body.name,
      theme: req.body.theme,
      description: req.body.description,
      capacity: req.body.capacity,
      difficulty: req.body.difficulty,
      duration: req.body.duration,
      imageUrl: req.body.imageUrl,
    },
  });
  res.status(201).json(room);
});

router.put('/:id', async (req, res) => {
  const room = await prisma.room.update({
    where: { id: parseInt(req.params.id) },
    data: req.body,
  });
  res.json(room);
});

router.delete('/:id', async (req, res) => {
  await prisma.room.update({
    where: { id: parseInt(req.params.id) },
    data: { isActive: false },
  });
  res.json({ message: '删除成功' });
});

module.exports = router;
