# lexcode-expect: 0
# Attachments that are not a person's recorded voice: images, documents, an audio
# file the app plays (a greeting jingle), and a plain method that mentions voice.
class Profile < ApplicationRecord
  # An ordinary photo the user uploads for their profile.
  has_one_attached :avatar
  has_many_attached :documents
  has_one_attached :cover_image do |attachable|
    attachable.variant :thumb, resize_to_limit: [100, 100]
  end
end

class Venue < ApplicationRecord
  # Audio the venue owner supplies, played as hold music; not a voice recording of a person.
  has_one_attached :hold_music
  has_one_attached :notification_sound
end

class Brand < ApplicationRecord
  mount_uploader :logo, LogoUploader
  has_attached_file :banner, styles: { wide: "1200x300>" }

  # A style setting named voice: the tone of written copy, with no audio in it.
  def voice
    "plain and direct"
  end

  def voice_guidelines
    "Write in the second person."
  end
end
