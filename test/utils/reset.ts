import 'dotenv/config';
import { resetDb, prisma } from './prismaTestClient';

(async () => {
  await resetDb();
  await prisma.$disconnect();
})();


