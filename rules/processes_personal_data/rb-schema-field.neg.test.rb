# lexcode-expect: 0
# Columns that hold no strong personal token, and code that only looks like a column.
class CreateTeams < ActiveRecord::Migration[7.1]
  def change
    create_table :teams do |t|
      t.string :name, null: false
      t.string :display_name
      t.string :slug
      t.text :description
      t.string :email_subject_template
      t.date :released_on
      t.datetime :archived_at
      t.boolean :archived, default: false
      t.timestamps
    end
    add_index :teams, :slug, unique: true
    add_column :teams, :nickname, :string
    add_column :teams, :phone_book_enabled, :boolean
  end
end

# A test factory sets attributes on instances; it declares no column.
FactoryBot.define do
  factory :customer do
    email { "demo@example.org" }
    phone { "555-0100" }
  end
end

# The app's own support address, held in a constant and a hash.
SUPPORT_EMAIL = "help@example.org".freeze
MAIL_SETTINGS = { from: SUPPORT_EMAIL, email: "no-reply@example.org" }.freeze

# A validator with no storage behind it.
def looks_like_email?(value)
  value.to_s.match?(/\A[^@\s]+@[^@\s]+\.[^@\s]+\z/)
end

# A receiver that is not a table builder.
class Report
  def build(row)
    row.string :email
    row.date :date_of_birth
  end
end
