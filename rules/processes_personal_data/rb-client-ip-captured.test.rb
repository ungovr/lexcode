# lexcode-expect: 9
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
    Visit.from_request(request)
  end
end

# An assignment inside an ActiveRecord model sets a column.
class Visit < ApplicationRecord
  def self.from_request(request)
    new(path: request.path).tap do |visit|
      visit.ip_address = request.remote_ip
      visit.save!
    end
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

# The values in an explicit braces hash, and a model on the older ActiveRecord::Base.
class AuditController < ApplicationController
  def create
    AuditEntry.create!({ action: params[:action_name], client_ip: request.remote_ip })
  end
end

class LegacyVisit < ActiveRecord::Base
  def stamp(request)
    self.last_ip = request.remote_ip
  end
end
