# lexcode-expect: 0
# Columns and attachments that are not a biometric template: a profile photo, device
# and certificate fingerprints, a face value, a voice setting, and a lookalike name
# on a plain method.
class CreateAccounts < ActiveRecord::Migration[7.1]
  def change
    create_table :accounts do |t|
      t.string :name
      t.string :avatar_url
      t.binary :photo
      t.string :device_fingerprint
      t.string :certificate_fingerprint
      t.string :fingerprint
      t.integer :face_value
      t.string :voice
      t.string :voice_style
      t.string :iris_id
      t.string :card_face
      t.timestamps
    end

    add_column :accounts, :browser_fingerprint, :string
    add_column :accounts, :face_up, :boolean
  end
end

class Account < ApplicationRecord
  # An ordinary photo the user uploads for their profile.
  has_one_attached :avatar
  has_one_attached :face_image
  has_many_attached :photos
  has_neighbors :description_embedding

  def face_template
    "default"
  end

  def fingerprint_cache_key
    Digest::SHA256.hexdigest(updated_at.to_s)
  end
end
