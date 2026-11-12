# lexcode-expect: 0
# Cookies that deliver the service: login, CSRF and preferences.
class SessionsController < ApplicationController
  def create
    user = User.authenticate(params[:email], params[:password])
    session[:user_id] = user.id
    # Remember-me keeps the person signed in on this browser; it is not a tracking id.
    cookies.permanent.signed[:remember_token] = user.remember_token
    cookies.signed[:user_id] = user.id
    cookies[:session] = { value: user.session_token, httponly: true, secure: true }
  end

  def destroy
    cookies.delete(:remember_token)
    cookies.delete(:visitor_id)
    reset_session
  end
end

class PreferencesController < ApplicationController
  def update
    cookies.permanent[:theme] = params[:theme]
    cookies[:locale] = { value: params[:locale], expires: 1.year.from_now }
    cookies[:csrf_token] = form_authenticity_token
    flash[:notice] = "Saved"
  end

  # Reading a cookie another system set is not writing one.
  def show
    @ga = cookies[:_ga]
    @visitor = cookies[:visitor_id]
  end
end

class FlashMiddleware
  def call(env)
    status, headers, body = @app.call(env)
    response = Rack::Response.new(body, status, headers)
    response.set_cookie("flash", value: "Signed out", max_age: 5)
    response.set_cookie("sid", value: env["rack.session"].id, httponly: true)
    response.finish
  end
end

class GuestCartsController < ApplicationController
  # A guest cart is keyed by a random id the app needs to find the cart again; it follows no one across sites.
  def show
    cookies.signed[:browser_id] ||= SecureRandom.uuid
    cookies.signed[:anonymous_token] = @cart.token
  end
end
