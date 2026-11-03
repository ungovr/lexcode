# lexcode-expect: 0
from app.models import Post


def render_post(post, viewer):
    if post.is_deleted:
        return None
    if viewer.is_adult:
        return render_full(post)
    return render_summary(post)


def browse(viewer):
    return Post.objects.filter(published=True).order_by("-created_at")[:50]


class Settings:
    nsfw_default = False
