# lexcode-expect: 2
from sqlalchemy import select

from app.models import Post


def home_feed(user, limit=50):
    followed = user.following.values_list("id", flat=True)
    return Post.objects.filter(author__in=followed, deleted_at__isnull=True).order_by("-created_at")[:limit]


def home_feed_sql(session, following_ids, limit=50):
    stmt = select(Post).where(Post.author_id.in_(following_ids)).order_by(Post.created_at.desc()).limit(limit)
    return session.scalars(stmt).all()
