# lexcode-expect: 7
# Recognizing people with Amazon Rekognition from Ruby: index a face, search a
# collection by photo, compare two photos. Keyword arguments and the hash form the AWS
# SDK documentation uses are both here.
require "aws-sdk-rekognition"

class FaceDirectory
  def initialize
    @rekognition = Aws::Rekognition::Client.new(region: "us-west-2")
  end

  def enroll(collection_id, bytes, person_id)
    @rekognition.index_faces(
      collection_id: collection_id,
      image: { bytes: bytes },
      external_image_id: person_id
    )
  end

  def find_person(collection_id, bytes)
    reply = @rekognition.search_faces_by_image(
      collection_id: collection_id, image: { bytes: bytes }, face_match_threshold: 90
    )
    reply.face_matches
  end

  def known_face(collection_id, face_id)
    @rekognition.search_faces(collection_id: collection_id, face_id: face_id, max_faces: 5)
  end

  def user_for(collection_id, bytes)
    @rekognition.search_users_by_image(collection_id: collection_id, image: { bytes: bytes })
  end
end

class SamePersonCheck
  def same_person?(source_bytes, target_bytes)
    client = Aws::Rekognition::Client.new
    reply = client.compare_faces(source_image: { bytes: source_bytes }, target_image: { bytes: target_bytes })
    reply.face_matches.any?
  end

  # The SDK's documented hash form.
  def similarity(source_bytes, target_bytes)
    client = Aws::Rekognition::Client.new
    reply = client.compare_faces({
      similarity_threshold: 90,
      source_image: { bytes: source_bytes },
      target_image: { bytes: target_bytes }
    })
    reply.face_matches.first&.similarity
  end

  def enroll_with_hash(bytes)
    Aws::Rekognition::Client.new.index_faces({ collection_id: "staff", image: { bytes: bytes } })
  end
end
