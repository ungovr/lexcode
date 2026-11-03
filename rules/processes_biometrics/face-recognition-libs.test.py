# lexcode-expect: 8
# Python face recognition: embeddings are computed from faces and compared with
# stored ones to say who someone is.
import cv2
import face_recognition
from deepface import DeepFace
from facenet_pytorch import InceptionResnetV1

embedder = InceptionResnetV1(pretrained="vggface2").eval()


def encode_known(path):
    image = face_recognition.load_image_file(path)
    return face_recognition.face_encodings(image)[0]


def who_is_this(known_encodings, names, path):
    unknown = face_recognition.face_encodings(face_recognition.load_image_file(path))[0]
    matches = face_recognition.compare_faces(known_encodings, unknown, tolerance=0.5)
    distances = face_recognition.face_distance(known_encodings, unknown)
    return [name for name, hit in zip(names, matches) if hit], distances


def same_person(first, second):
    return DeepFace.verify(img1_path=first, img2_path=second, model_name="ArcFace")["verified"]


def search_gallery(path, gallery_dir):
    return DeepFace.find(img_path=path, db_path=gallery_dir)


def train_opencv_recognizer(faces, labels):
    recognizer = cv2.face.LBPHFaceRecognizer_create()
    recognizer.train(faces, labels)
    return recognizer
