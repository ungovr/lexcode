# lexcode-expect: 0
# Server-side logging, error reporting and the app's own counters.
require "logger"
require "sentry-ruby"

class ApplicationController < ActionController::Base
  rescue_from StandardError do |error|
    Sentry.capture_exception(error)
    Rails.logger.error("request failed: #{error.class} on #{request.path}")
    head :internal_server_error
  end
end

# The app's own metrics module, with the same method names and no vendor behind it.
class Analytics
  def self.track(name, properties = {})
    counters[name] += 1
  end

  def self.identify(id, traits = {})
    id
  end

  def self.page(name)
    name
  end

  def self.counters
    @counters ||= Hash.new(0)
  end
end

Analytics.track("jobs_run")
Analytics.page("about")

# An internal counter reached through StatsD, and a progress tracker.
StatsD.increment("requests.served")

class ProgressTracker
  def initialize(total)
    @total = total
  end

  def track(step)
    step.to_f / @total
  end
end

ProgressTracker.new(10).track(3)

# A client with a capture method that is not a product-analytics call.
class Camera
  def capture(frame)
    frame
  end
end

Camera.new.capture(1)
