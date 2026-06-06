const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generateTestData() {
  console.log('开始生成测试数据...');

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);

  const dates = [today, tomorrow, dayAfter];
  const rooms = await prisma.room.findMany();
  const npcs = await prisma.employee.findMany({ where: { position: 'NPC' } });

  for (const room of rooms) {
    const templates = await prisma.sessionTemplate.findMany({
      where: { roomId: room.id },
    });

    for (const date of dates) {
      const dateStr = date.toISOString().split('T')[0];

      for (const template of templates) {
        let npcId = null;
        if (npcs.length > 0) {
          npcId = npcs[Math.floor(Math.random() * npcs.length)].id;
        }

        const bookedCount = Math.floor(Math.random() * 3);

        const sessionDate = new Date(dateStr);
        
        const existing = await prisma.session.findFirst({
          where: {
            roomId: room.id,
            sessionDate: sessionDate,
            startTime: template.startTime,
          },
        });

        if (!existing) {
          await prisma.session.create({
            data: {
              roomId: room.id,
              templateId: template.id,
              sessionDate: sessionDate,
              startTime: template.startTime,
              endTime: template.endTime,
              price: template.price,
              maxCapacity: room.capacity,
              bookedCount: bookedCount,
              status: 'available',
            },
          });
        }
      }
    }
  }

  console.log('场次数据生成完成！');

  console.log('场次数据已生成，可通过后台管理系统查看！');

  console.log('所有测试数据生成完成！');
}

generateTestData()
  .catch((e) => {
    console.error('生成数据失败:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
