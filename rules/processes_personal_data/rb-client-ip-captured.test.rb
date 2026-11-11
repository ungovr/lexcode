# lexcode-expect: 7
# Controllers and middleware that write the visitor's address into a log or a table.
class SessionsController < ApplicationController
  def create
    Rails.logger.info("sign-in from #{request.remote_ip}")
    ip = request.ip
    LoginEvent.create!(user: current_user, ip_address: ip)
  end

  def touch
    current_user.update(last_sign_in_ip: request.remote_ip)
  end

  def record
    visit = Visit.find_or_initialize_by(token: params[:token])
    visit.ip_address = request.remote_ip
    visit.save!
  end
end

class AccessLog
  def initialize(app)
    @app = app
    @logger = Logger.new($stdout)
  end

  def call(env)
    request = ActionDispatch::Request.new(env)
    @logger.info "GET #{request.path} from #{request.env['REMOTE_ADDR']}"
    @app.call(env)
  end
end

class HitsController < ApplicationController
  def show
    Hit.insert_all([{ path: request.path, address: request.headers["X-Forwarded-For"] }])
    logger.warn("forwarded for #{request.headers['X-Forwarded-For']}")
  end
end
