# lexcode-expect: 0
from sqlalchemy import select

from app.models import Article, Post


def my_posts(user):
    return Post.objects.filter(author=user).order_by("-created_at")


def latest_from_sources(source_ids):
    return Article.objects.filter(source__in=source_ids).order_by("-published_at")[:100]


def orders_for(session, customer_ids):
    return session.scalars(select(Order).where(Order.customer_id.in_(customer_ids))).all()
