// lexcode-expect: 2
import { prisma } from './db';
import { Post } from './models/post';

export async function homeFeed(userId: string, take = 50) {
  const edges = await prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });
  const followingIds = edges.map((e) => e.followingId);
  return prisma.post.findMany({
    where: { authorId: { in: followingIds } },
    orderBy: { createdAt: 'desc' },
    take,
  });
}

export async function homeFeedMongo(user: { following: string[] }) {
  return Post.find({ author: { $in: user.following } }).sort({ createdAt: -1 }).limit(50);
}
