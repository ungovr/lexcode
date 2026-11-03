// lexcode-expect: 0
export function PostCard({ post, viewer }) {
  if (post.isDeleted) return null;
  return post.isPinned ? <PinnedPost post={post} /> : <FullPost post={post} showBadge={viewer.isAdult} />;
}

export function Banner({ user }) {
  return <div>{user.isAdult && <Welcome user={user} />}</div>;
}
