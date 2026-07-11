import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function clean() {
  console.log("Cleaning up previously anonymized records from the archive...");
  
  const result = await prisma.deletedAccountArchive.deleteMany({
    where: {
      OR: [
        { name: { contains: 'Deleted' } },
        { email: { startsWith: 'deleted_' } }
      ]
    }
  });

  console.log(`Successfully removed ${result.count} dummy records from the archive!`);
  await prisma.$disconnect();
}

clean();
