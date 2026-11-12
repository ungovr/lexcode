# lexcode-expect: 8
# A schema that stores biometric templates: face embeddings, fingerprint templates, a
# voiceprint and an iris code, as migration columns, a schema dump and attachments.
class AddBiometricsToEmployees < ActiveRecord::Migration[7.1]
  def change
    create_table :enrollments do |t|
      t.references :employee, null: false, foreign_key: true
      t.binary :face_template
      t.column :fingerprint_template, :binary
      t.vector :face_embedding, limit: 512
      t.timestamps
    end

    add_column :employees, :voiceprint, :binary
    add_column :employees, :iris_code, :binary
  end
end

# A schema.rb dump writes the names as strings.
ActiveRecord::Schema[7.1].define(version: 2026_11_01_000000) do
  create_table "badge_scans", force: :cascade do |t|
    t.binary "palm_template"
  end
end

class Employee < ApplicationRecord
  has_one_attached :fingerprint_scan
  has_neighbors :face_embedding
end
