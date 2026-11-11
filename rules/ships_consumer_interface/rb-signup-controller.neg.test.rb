# lexcode-expect: 0
class Admin::UsersController < Admin::BaseController
  before_action :require_staff!

  def create
    @user = User.invite!(user_params)
    redirect_to admin_users_path
  end
end

class SessionsController < ApplicationController
  def create
    user = User.authenticate(params[:email], params[:password])
    session[:user_id] = user.id
    redirect_to root_path
  end
end

class Admin::RegistrationsController < Admin::BaseController
  def create
    Registration.create!(registration_params)
  end
end

class VehicleRegistrationsController < ApplicationController
  def create
    @vehicle = Vehicle.create!(vehicle_params)
    redirect_to @vehicle
  end
end

class Lti::RegistrationsController < ApplicationController
  # An account administrator registers an LTI tool: no member of the public signs up.
  def create
    registration = Lti::CreateRegistrationService.call(account: @context, created_by: @current_user)
    render json: registration
  end
end

class ArticlesController < ApplicationController
  def create
    @profile = Profile.create!(profile_params)
    redirect_to @profile
  end
end

class InvitationsController < ApplicationController
  def accept
    Invitation.find_by!(token: params[:token]).accept!
  end
end

class AdminUser < ApplicationRecord
  devise :database_authenticatable, :recoverable, :rememberable
end

class StaffMember < ApplicationRecord
  devise :database_authenticatable, :registerable
end
