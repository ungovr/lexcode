# lexcode-expect: 0
# Face detection used to find or crop a face, attribute analysis, plain image
# resizing, and detection-only InsightFace. No one is recognized or matched.
import cv2
import dlib
import face_recognition
from deepface import DeepFace
from facenet_pytorch import MTCNN
from insightface.app import FaceAnalysis
from PIL import Image

detector = dlib.get_frontal_face_detector()
mtcnn = MTCNN(keep_all=True)
crop_only = FaceAnalysis(name="buffalo_l", allowed_modules=["detection"])


def crop_faces(path, out_dir):
    image = face_recognition.load_image_file(path)
    for index, (top, right, bottom, left) in enumerate(face_recognition.face_locations(image)):
        Image.fromarray(image[top:bottom, left:right]).save(f"{out_dir}/face-{index}.jpg")


def blur_faces(image):
    for rect in detector(image):
        region = image[rect.top():rect.bottom(), rect.left():rect.right()]
        image[rect.top():rect.bottom(), rect.left():rect.right()] = cv2.GaussianBlur(region, (51, 51), 0)
    return image


def count_faces(image):
    boxes, _ = mtcnn.detect(image)
    return 0 if boxes is None else len(boxes)


def boxes_only(image):
    return [face.bbox for face in crop_only.get(image)]


def apparent_age(path):
    return DeepFace.analyze(img_path=path, actions=["age"])[0]["age"]


def thumbnail(path, size):
    with Image.open(path) as picture:
        picture.thumbnail(size)
        return picture.copy()
