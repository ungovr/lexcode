# lexcode-expect: 0
# Rekognition used for labels, text and moderation, and a local function whose
# name matches a face-matching call.
import boto3

rekognition = boto3.client("rekognition", region_name="us-west-2")


def labels_for(image_bytes):
    reply = rekognition.detect_labels(Image={"Bytes": image_bytes}, MaxLabels=10)
    return [label["Name"] for label in reply["Labels"]]


def read_sign(image_bytes):
    reply = rekognition.detect_text(Image={"Bytes": image_bytes})
    return [item["DetectedText"] for item in reply["TextDetections"]]


def is_safe(image_bytes):
    reply = rekognition.detect_moderation_labels(Image={"Bytes": image_bytes})
    return not reply["ModerationLabels"]


def count_faces(image_bytes):
    reply = rekognition.detect_faces(Image={"Bytes": image_bytes})
    return len(reply["FaceDetails"])


class Catalog:
    def compare_faces(self, left, right):
        # Compares two lists of strings. The name is the only thing it shares with Rekognition.
        return set(left) & set(right)


def overlap(left, right):
    return Catalog().compare_faces(left, right)
