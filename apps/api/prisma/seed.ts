import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main(){
  const users = await prisma.user.findMany();
  if(users.length) return;

  await prisma.user.create({
    data: {
      email: 'demo@local.test',
      passwordHash: 'seeded' // replace with real hash when running
    }
  });

  console.log('Seed complete');
}

main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>prisma.$disconnect());
