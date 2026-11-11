# lexcode-expect: 0
# Fastlane lanes that only test or build for a simulator, reads of store state that upload
# nothing, and Ruby code that merely shares a method name with a fastlane action.
default_platform(:ios)

platform :ios do
  desc "Run the unit and UI tests on a simulator"
  lane :test do
    run_tests(scheme: "App", devices: ["iPhone 15"], clean: true)
    scan(scheme: "AppUITests", device: "iPhone 15 Pro")
  end

  lane :simulator_build do |options|
    gym(
      scheme: "App",
      configuration: "Debug",
      destination: "generic/platform=iOS Simulator",
      skip_archive: true
    )
  end

  lane :certs do
    match(type: "development", readonly: true)
    increment_build_number(build_number: latest_testflight_build_number + 1)
  end

  lane :shots do
    snapshot
    frame_screenshots
  end

  # These read from the store and upload nothing.
  private_lane :check_versions do
    current = app_store_build_number(live: true)
    beta = latest_testflight_build_number(version: "2.4.0")
    UI.message("live #{current}, beta #{beta}")
  end
end

platform :android do
  lane :unit do
    gradle(task: "test", build_type: "Debug")
    sh("bundle exec rspec spec/models")
  end
end

# Ordinary Rails code that shares a name with a fastlane action but is not one.
class WelcomeMailer < ApplicationMailer
  def welcome(user)
    @user = user
    mail(to: user.email, subject: "Welcome")
  end
end

class SignupsController < ApplicationController
  def create
    user = User.create!(signup_params)
    WelcomeMailer.welcome(user).deliver_later
    WelcomeMailer.welcome(user).deliver
    redirect_to root_path
  end
end

class Courier
  def run(parcel)
    deliver(parcel)
  end

  def deliver(parcel)
    parcel.mark_delivered!
  end
end

class Warehouse
  def restock(item)
    supply = item.supply
    pilot = Pilot.find_by(name: item.pilot_name)
    [supply, pilot]
  end
end
