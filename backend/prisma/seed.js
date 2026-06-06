const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.room.createMany({
    data: [
      {
        name: '古墓迷踪',
        theme: '恐怖解谜',
        description: '穿越千年古墓，揭开神秘面纱',
        capacity: 6,
        difficulty: 4,
        duration: 60,
      },
      {
        name: '星际迷航',
        theme: '科幻冒险',
        description: '探索未知宇宙，拯救人类未来',
        capacity: 8,
        difficulty: 3,
        duration: 75,
      },
      {
        name: '古宅惊魂',
        theme: '惊悚悬疑',
        description: '百年古宅中的灵异传说',
        capacity: 5,
        difficulty: 5,
        duration: 60,
      },
    ],
  });

  await prisma.sessionTemplate.createMany({
    data: [
      { roomId: 1, name: '上午场', startTime: '10:00', endTime: '11:00', price: 128, weekdays: '1,2,3,4,5,6,7' },
      { roomId: 1, name: '下午场', startTime: '14:00', endTime: '15:00', price: 148, weekdays: '1,2,3,4,5,6,7' },
      { roomId: 1, name: '晚场', startTime: '19:00', endTime: '20:00', price: 168, weekdays: '1,2,3,4,5,6,7' },
      { roomId: 2, name: '上午场', startTime: '10:30', endTime: '11:45', price: 138, weekdays: '1,2,3,4,5,6,7' },
      { roomId: 2, name: '下午场', startTime: '14:30', endTime: '15:45', price: 158, weekdays: '1,2,3,4,5,6,7' },
      { roomId: 2, name: '晚场', startTime: '19:30', endTime: '20:45', price: 178, weekdays: '1,2,3,4,5,6,7' },
      { roomId: 3, name: '上午场', startTime: '11:00', endTime: '12:00', price: 118, weekdays: '1,2,3,4,5,6,7' },
      { roomId: 3, name: '下午场', startTime: '15:00', endTime: '16:00', price: 138, weekdays: '1,2,3,4,5,6,7' },
      { roomId: 3, name: '晚场', startTime: '20:00', endTime: '21:00', price: 158, weekdays: '1,2,3,4,5,6,7' },
    ],
  });

  await prisma.snack.createMany({
    data: [
      { name: '矿泉水', category: '饮品', price: 5, stock: 100 },
      { name: '可乐', category: '饮品', price: 8, stock: 80 },
      { name: '奶茶', category: '饮品', price: 15, stock: 50 },
      { name: '爆米花', category: '零食', price: 12, stock: 60 },
      { name: '薯片', category: '零食', price: 10, stock: 70 },
    ],
  });

  await prisma.employee.createMany({
    data: [
      { name: '张三', phone: '13800138001', position: '前台', baseSalary: 3500, hireDate: new Date('2023-01-15') },
      { name: '李四', phone: '13800138002', position: '前台', baseSalary: 3500, hireDate: new Date('2023-03-20') },
      { name: '王五', phone: '13800138003', position: 'NPC', baseSalary: 4000, hireDate: new Date('2022-11-10') },
      { name: '赵六', phone: '13800138004', position: 'NPC', baseSalary: 4000, hireDate: new Date('2023-05-01') },
      { name: '钱七', phone: '13800138005', position: '保洁', baseSalary: 2800, hireDate: new Date('2023-02-28') },
    ],
  });

  await prisma.commissionRule.createMany({
    data: [
      { ruleType: 'ticket', name: '前台售票提成', rate: 5 },
      { ruleType: 'npc', name: 'NPC带队补助', rate: 0, fixedAmount: 30 },
      { ruleType: 'snack', name: '零食销售提成', rate: 8 },
    ],
  });

  await prisma.attendanceRule.create({
    data: { name: '全勤奖', fullDays: 26, bonusAmount: 300, latePenalty: 20 },
  });

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
