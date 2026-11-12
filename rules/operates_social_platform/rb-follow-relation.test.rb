# lexcode-expect: 8
class Follow < ApplicationRecord
  belongs_to :follower, class_name: "User"
  belongs_to :followed, class_name: "User"

  validates :follower_id, uniqueness: { scope: :followed_id }
end

class Relationship < ApplicationRecord
  belongs_to :follower, class_name: "User"
  belongs_to :followee, class_name: "User"
end

class Friendship < ApplicationRecord
  belongs_to :user
  belongs_to :friend, class_name: "User"
end

class FriendRequest < ApplicationRecord
  belongs_to :requester, class_name: "User"
  belongs_to :addressee, class_name: "User"
  enum :status, { pending: 0, accepted: 1 }
end

class User < ApplicationRecord
  has_many :active_relationships, class_name: "Relationship", foreign_key: "follower_id", dependent: :destroy
  has_many :passive_relationships, class_name: "Relationship", foreign_key: "followee_id", dependent: :destroy
  has_many :followers, through: :passive_relationships, source: :follower
  has_many :following, through: :active_relationships, source: :followee
end

class Author < ApplicationRecord
  acts_as_followable
end

class Reader < ApplicationRecord
  acts_as_follower
end
