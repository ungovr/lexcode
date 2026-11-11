# lexcode-expect: 7
# Controllers and middleware that hand each visitor a long-lived id, or an analytics or advertising cookie.
class ApplicationController < ActionController::Base
  before_action :remember_visitor

  def remember_visitor
    cookies.permanent[:visitor_id] ||= SecureRandom.uuid
  end
end

class LandingController < ApplicationController
  def index
    cookies.permanent.signed[:device_id] = SecureRandom.uuid
    cookies[:_ga] = { value: "GA1.2.#{rand(1_000_000)}", expires: 2.years.from_now }
    cookies.encrypted[:anonymous_id] = { value: SecureRandom.hex(8), expires: 1.year.from_now }
  end

  def pixel
    cookies[:_fbp] = "fb.1.#{Time.now.to_i}.#{rand(1_000_000_000)}"
  end
end

# Ahoy's own visitor cookie, set by hand.
class VisitorsController < ApplicationController
  def show
    cookies["ahoy_visitor"] = { value: SecureRandom.uuid, expires: 2.years.from_now }
  end
end

# Rack middleware.
class VisitorCookie
  def initialize(app)
    @app = app
  end

  def call(env)
    status, headers, body = @app.call(env)
    response = Rack::Response.new(body, status, headers)
    response.set_cookie("tracking_id", value: SecureRandom.uuid, max_age: 63_072_000)
    response.finish
  end
end
