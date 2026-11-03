# lexcode-expect: 3
# Matching faces with Amazon Rekognition from Python: index a face, search a
# collection, and compare two photos.
import boto3

rekognition = boto3.client("rekognition", region_name="us-west-2")


def enroll_face(collection_id, image_bytes, person_id):
    return rekognition.index_faces(
        CollectionId=collection_id,
        Image={"Bytes": image_bytes},
        ExternalImageId=person_id,
    )


def find_person(collection_id, image_bytes):
    reply = rekognition.search_faces_by_image(
        CollectionId=collection_id, Image={"Bytes": image_bytes}, FaceMatchThreshold=90
    )
    return reply["FaceMatches"]


def same_person(source_bytes, target_bytes):
    client = boto3.client("rekognition")
    reply = client.compare_faces(SourceImage={"Bytes": source_bytes}, TargetImage={"Bytes": target_bytes})
    return bool(reply["FaceMatches"])
