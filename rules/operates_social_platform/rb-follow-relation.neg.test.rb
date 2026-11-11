# lexcode-expect: 0
class Subscription < ApplicationRecord
  # A reader's subscription to one newsletter.
  belongs_to :user
  belongs_to :newsletter
end

class FriendlyError < StandardError
  # An error with wording meant for the person at the keyboard.
end

class OutcomeFriendlyDescription < ApplicationRecord
  belongs_to :learning_outcome
  belongs_to :context, polymorphic: true
end

class Ticket < ApplicationRecord
  belongs_to :assignee, class_name: "StaffMember"
  has_many :follow_ups, dependent: :destroy
  has_many :followup_tasks
end

class GitHubProfile
  attr_reader :login, :followers_count, :following_count

  def initialize(payload)
    @login = payload["login"]
    @followers_count = payload["followers"]
    @following_count = payload["following"]
  end

  def summary
    "#{login}: #{followers_count} followers"
  end
end
