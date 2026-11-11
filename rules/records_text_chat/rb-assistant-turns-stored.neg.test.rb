# lexcode-expect: 0
# Records that carry a role but are not a conversation with an assistant: accounts, memberships,
# and a message table that holds a form.
class UsersController < ApplicationController
  def create
    User.create!(email: params[:email], role: "user")
  end
end

class MembershipsController < ApplicationController
  def create
    @team.members.create(user: current_user, role: :user)
    Membership.create!(team: @team, role: "admin")
  end
end

class InquiriesController < ApplicationController
  def create
    # A form the app only saves.
    Message.create!(sender: params[:email], subject: params[:subject], body: params[:body])
    @inbox.messages.create(subject: "Receipt", body: "Thanks for writing")
  end
end

class Seeds
  def run
    Role.create!(name: "user")
    @chat.messages.create!(role: "system", content: "You answer questions about the library.")
  end
end
