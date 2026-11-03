// lexcode-expect: 0
import { prisma } from './db';

export async function browse(take = 50) {
  return prisma.post.findMany({
    where: { published: true, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take,
  });
}

export const defaults = { nsfw: true };
