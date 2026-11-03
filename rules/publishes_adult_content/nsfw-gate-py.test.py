# lexcode-expect: 3
from app.models import Post


def render_post(post, viewer):
    if post.is_nsfw and not viewer.confirmed_adult:
        return render_blurred(post)
    return render_full(post)


def browse(viewer):
    posts = Post.objects.filter(nsfw=False)
    return posts.order_by("-created_at")[:50]


def safe_search(query):
    return Post.objects.exclude(is_nsfw=True).filter(title__icontains=query)
