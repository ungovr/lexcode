// lexcode-expect: 0
import { prisma } from './db';

export async function myPosts(userId: string) {
  return prisma.post.findMany({ where: { authorId: userId }, orderBy: { createdAt: 'desc' } });
}

export async function byIds(ids: string[]) {
  return prisma.post.findMany({ where: { id: { in: ids } } });
}

export async function articlesFromSources(sourceIds: string[]) {
  return prisma.article.findMany({ where: { sourceId: { in: sourceIds } } });
}
