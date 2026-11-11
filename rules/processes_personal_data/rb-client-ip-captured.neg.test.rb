# lexcode-expect: 0
# The address is compared, counted in memory or left out of the record.
ALLOWED = %w[10.0.0.5 10.0.0.6].freeze

class AdminController < ApplicationController
  before_action :restrict_to_office

  def index
    render plain: "ok"
  end

  private

  # The address is compared and discarded.
  def restrict_to_office
    head :forbidden unless ALLOWED.include?(request.remote_ip)
  end
end

# A rate-limit key held in memory, never written anywhere.
class Rack::Attack
  throttle("requests by ip", limit: 300, period: 5.minutes) do |req|
    req.ip
  end
end

class RateLimiter
  def initialize
    @hits = Hash.new(0)
  end

  def allow?(request, limit: 100)
    @hits[request.remote_ip] += 1
    @hits[request.remote_ip] <= limit
  end
end

# Logging and storing without the address.
class OrdersController < ApplicationController
  def create
    Rails.logger.info("order placed on #{request.path}")
    Order.create!(user: current_user, total_cents: params[:total_cents])
  end
end

# Forwarded protocol is not the person's address.
class ProxyController < ApplicationController
  def scheme
    proto = request.headers["X-Forwarded-Proto"]
    Rails.logger.debug("proto #{proto}")
    render plain: proto.to_s
  end
end

# The server's own bind address and a literal loopback.
BIND_HOST = "0.0.0.0".freeze
Rails.logger.info("listening on #{BIND_HOST}")
Rails.logger.info("probe from 127.0.0.1")
