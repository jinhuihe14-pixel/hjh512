const express = require('express');
const { prisma } = require('../prisma');
const asyncHandler = require('../utils/asyncHandler');
const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const { category, isActive } = req.query;
  const where = {};
  if (category) where.category = category;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const snacks = await prisma.snack.findMany({ where });
  res.json(snacks);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const snack = await prisma.snack.findUnique({
    where: { id: parseInt(req.params.id) },
  });
  if (!snack) return res.status(404).json({ error: '商品不存在' });
  res.json(snack);
}));

router.post('/', asyncHandler(async (req, res) => {
  const snack = await prisma.snack.create({
    data: {
      name: req.body.name,
      category: req.body.category,
      price: parseFloat(req.body.price),
      stock: parseInt(req.body.stock) || 0,
      imageUrl: req.body.imageUrl,
    },
  });
  res.status(201).json(snack);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (data.price) data.price = parseFloat(data.price);
  if (data.stock !== undefined) data.stock = parseInt(data.stock);

  const snack = await prisma.snack.update({
    where: { id: parseInt(req.params.id) },
    data,
  });
  res.json(snack);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await prisma.snack.update({
    where: { id: parseInt(req.params.id) },
    data: { isActive: false },
  });
  res.json({ message: '已下架' });
}));

module.exports = router;
