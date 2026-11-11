# lexcode-expect: 10
# Server-side analytics: each call follows the visitor with a vendor id.
require "segment/analytics"
require "mixpanel-ruby"

# Segment's documented setup.
Analytics = Segment::Analytics.new(write_key: ENV["SEGMENT_WRITE_KEY"])
MIXPANEL = Mixpanel::Tracker.new(ENV["MIXPANEL_TOKEN"])
POSTHOG = PostHog::Client.new(api_key: ENV["POSTHOG_KEY"])
RUDDER = Rudder::Analytics.new(write_key: ENV["RUDDER_KEY"], data_plane_url: "https://example.dataplane.rudderstack.com")

class ApplicationController < ActionController::Base
  after_action :track_page_view

  def track_page_view
    ahoy.track "Viewed page", path: request.path
  end
end

class User < ApplicationRecord
  visitable :ahoy_visit
end

class SignupsController < ApplicationController
  def create
    user = User.create!(user_params)
    Analytics.track(user_id: user.id.to_s, event: "Signed Up", properties: { plan: user.plan })
    POSTHOG.capture(distinct_id: user.id.to_s, event: "signed_up")
    AmplitudeAPI.track(AmplitudeAPI::Event.new(user_id: user.id.to_s, event_type: "Signed Up"))
  end
end

class GaProxy
  def hit(path)
    Staccato.tracker(ENV["GA_TRACKING_ID"]).pageview(path: path)
  end
end
