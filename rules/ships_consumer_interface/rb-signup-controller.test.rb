# lexcode-expect: 4
class RegistrationsController < ApplicationController
  def new
    @user = User.new
  end

  def create
    @user = User.new(user_params)
    if @user.save
      sign_in(@user)
      redirect_to root_path, notice: "Welcome"
    else
      render :new
    end
  end
end

class Users::RegistrationsController < Devise::RegistrationsController
  def create
    super do |user|
      WelcomeMailer.hello(user).deliver_later
    end
  end
end

class SignupsController < ApplicationController
  def create
    Account.create!(signup_params)
  end
end

class User < ApplicationRecord
  devise :database_authenticatable, :registerable, :recoverable, :validatable
end
