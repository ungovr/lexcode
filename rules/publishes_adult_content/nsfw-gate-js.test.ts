// lexcode-expect: 1
import { prisma } from './db';

export async function browse(take = 50) {
  return prisma.post.findMany({
    where: { nsfw: false, published: true },
    orderBy: { createdAt: 'desc' },
    take,
  });
}
