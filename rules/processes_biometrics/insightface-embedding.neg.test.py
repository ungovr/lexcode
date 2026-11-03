# lexcode-expect: 0
# InsightFace restricted to detection: boxes and landmarks for cropping, no
# recognition model loaded and no embedding produced.
from insightface.app import FaceAnalysis

crop_only = FaceAnalysis(name="buffalo_l", allowed_modules=["detection"])
crop_only.prepare(ctx_id=0)


def boxes_only(image):
    return [face.bbox for face in crop_only.get(image)]


def crop_all(image):
    return [image[int(y1):int(y2), int(x1):int(x2)] for x1, y1, x2, y2 in boxes_only(image)]


class Cache:
    def get(self, key):
        return key


def lookup(key):
    return Cache().get(key)
