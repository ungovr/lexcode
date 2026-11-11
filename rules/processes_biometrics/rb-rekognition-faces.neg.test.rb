# lexcode-expect: 0
# Rekognition used for labels, text, moderation and face detection (is there a face,
# where), which recognizes nobody, and a local class with face-matching method names.
require "aws-sdk-rekognition"

class ImageInspector
  def initialize
    @rekognition = Aws::Rekognition::Client.new(region: "us-west-2")
  end

  def labels_for(bytes)
    @rekognition.detect_labels(image: { bytes: bytes }, max_labels: 10).labels.map(&:name)
  end

  def read_sign(bytes)
    @rekognition.detect_text(image: { bytes: bytes }).text_detections.map(&:detected_text)
  end

  def safe?(bytes)
    @rekognition.detect_moderation_labels(image: { bytes: bytes }).moderation_labels.empty?
  end

  # Counting the faces in a photo, to crop a thumbnail, identifies no one.
  def face_count(bytes)
    @rekognition.detect_faces(image: { bytes: bytes }).face_details.length
  end

  def face_count_with_hash(bytes)
    @rekognition.detect_faces({ image: { bytes: bytes }, attributes: ["DEFAULT"] }).face_details.length
  end
end

class Catalog
  # Compares two lists of strings. The name is all it shares with Rekognition.
  def compare_faces(left, right)
    left & right
  end

  def search_faces(query, collection)
    collection.select { |name| name.include?(query) }
  end

  def index_faces(names)
    names.each_with_index.to_h
  end
end

class Overlap
  def run(left, right)
    Catalog.new.compare_faces(left, right)
  end
end
