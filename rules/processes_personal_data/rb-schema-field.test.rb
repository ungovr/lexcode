# lexcode-expect: 19
# Rails migrations and a schema dump that create or add personal columns.
class CreateCustomers < ActiveRecord::Migration[7.1]
  def change
    create_table :customers do |t|
      t.string :display_name
      t.string :email, null: false
      t.string :phone_number
      t.date :date_of_birth
      t.inet :last_sign_in_ip
      t.timestamps
    end
    add_index :customers, :email, unique: true
  end
end

class AddContactDetailsToMembers < ActiveRecord::Migration[7.1]
  def change
    add_column :members, :phone, :string
    add_column(:members, "birthday", :date)
    add_column :members, :ssn, :string, limit: 11
    change_table :members do |t|
      t.column :passport_number, :string
    end
  end
end

# db/schema.rb writes the column names as strings.
ActiveRecord::Schema[7.1].define(version: 2026_11_10_000000) do
  create_table "subscribers", force: :cascade do |t|
    t.string "topic"
    t.string "email", default: "", null: false
    t.string "current_sign_in_ip"
  end
end

# Shapes the anchor must admit: a leading-dot chain, a trailing dot and safe navigation.
class CreateChainShapes < ActiveRecord::Migration[7.1]
  def change
    create_table :people do |t|
      t
        .string :email, null: false
      t.
        string :phone_number
      t&.date :date_of_birth
      t.string(
        :last_sign_in_ip,
        null: true
      )
    end
  end
end

# Shapes the anchor must also admit: an empty () after a no-arg method, a comment line or a
# backslash between the two tokens, and (schema, Mailchimp) text after or far from the key.
class CreateResidualShapes < ActiveRecord::Migration[7.1]
  def change
    create_table :people do |t|
      t.string :email # login address
      t.date :date_of_birth # YYYY-MM-DD
      t.inet :last_sign_in_ip   # filled by Devise
      t.string :ssn if respond_to?(:string)
      t # builder
        .string :phone_number
    end
  end
end
