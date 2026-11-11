# lexcode-expect: 5
# Models that store a person's recorded voice: voice notes and voicemail kept as
# Active Storage, CarrierWave and Paperclip attachments.
class VoiceNote < ApplicationRecord
  belongs_to :user
  has_one_attached :voice_note, dependent: :purge_later
  validates :voice_note, presence: true
end

class Message < ApplicationRecord
  belongs_to :conversation
  has_one_attached :voice_message do |attachable|
    attachable.variant :preview, resize_to_limit: [100, 100]
  end
end

class Voicemail < ApplicationRecord
  has_one_attached :voicemail
end

class Memo < ApplicationRecord
  mount_uploader :voice_memo, AudioUploader
end

class LegacyClip < ActiveRecord::Base
  has_attached_file :voice_recording, path: ":rails_root/storage/:class/:id.:extension"
  validates_attachment_content_type :voice_recording, content_type: %r{\Aaudio/}
end
