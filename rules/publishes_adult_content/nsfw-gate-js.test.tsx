// lexcode-expect: 3
import { prisma } from './db';

export function PostCard({ post, viewer }) {
  if (post.isNsfw && !viewer.confirmedAdult) {
    return <BlurredPost post={post} />;
  }
  return post.nsfw ? <FullPost post={post} showBadge /> : <FullPost post={post} />;
}

export function Warning({ post }) {
  return <div>{post.adultContent && <AdultNotice />}</div>;
}
