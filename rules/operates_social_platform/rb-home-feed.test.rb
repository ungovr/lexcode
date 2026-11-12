# lexcode-expect: 5
class Post < ApplicationRecord
  scope :home_feed, ->(user) { where(author_id: user.friend_ids).order(created_at: :desc) }
end

class FeedsController < ApplicationController
  def show
    @posts = Post.where(author_id: current_user.following_ids).order(created_at: :desc).limit(50)
  end

  def by_association
    @posts = Post.where(user: current_user.following).includes(:user)
  end

  def by_subquery
    @posts = Post.where(author_id: Follow.where(follower_id: current_user.id).select(:followed_id))
  end
end

class Micropost < ApplicationRecord
  def self.from_followed_by(user)
    where("user_id IN (:following_ids) OR user_id = :user_id", following_ids: user.following_ids, user_id: user.id)
  end
end
