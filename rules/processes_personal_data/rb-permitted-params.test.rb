# lexcode-expect: 6
# Controllers that accept personal details from a submitted form.
class UsersController < ApplicationController
  def create
    @user = User.new(user_params)
    @user.save
  end

  private

  def user_params
    params.require(:user).permit(:name, :email, :password, :password_confirmation)
  end
end

class ContactsController < ApplicationController
  def create
    Contact.create!(params.permit(:message, :phone_number))
  end
end

class ProfilesController < ApplicationController
  def update
    current_user.profile.update(profile_params)
  end

  private

  def profile_params
    params.fetch(:profile, {}).permit(:bio, :date_of_birth)
  end
end

# Rails 8 params.expect.
class MembersController < ApplicationController
  def member_params
    params.expect(member: [:name, :email])
  end

  def lookup_params
    params.expect(:ssn)
  end

  def signup_params
    params.require("signup").permit("email", :plan)
  end
end
