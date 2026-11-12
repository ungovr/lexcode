# lexcode-expect: 9
# A Fastfile: lanes that send a build to Apple's or Google's store. Fastlane actions are often
# called without parentheses and with keyword arguments.
default_platform(:ios)

platform :ios do
  before_all do
    setup_ci if ENV["CI"]
  end

  desc "Push a new beta build to TestFlight"
  lane :beta do |options|
    match(type: "appstore", readonly: true)
    build_app(scheme: "App", export_method: "app-store")
    upload_to_testflight(skip_waiting_for_build_processing: true, changelog: options[:notes])
  end

  desc "Submit a release to the App Store"
  lane :release do
    build_app(scheme: "App")
    upload_to_app_store force: true, skip_metadata: false, submit_for_review: true
  end

  lane :release_with_description, description: "Ship it" do
    deliver(ipa: "build/App.ipa", force: true)
  end

  lane :testers do
    build_app(scheme: "App")
    pilot(distribute_external: true, groups: ["Beta"])
  end

  lane :testers_bare do
    pilot
  end

  lane :bare_upload do
    upload_to_testflight
  end
end

platform :android do
  desc "Deploy a new version to the Google Play internal track"
  lane :deploy do
    gradle(task: "clean bundle", build_type: "Release")
    upload_to_play_store(track: "internal", aab: "app/build/outputs/bundle/release/app-release.aab")
  end

  lane :promote do
    supply track: "internal", track_promote_to: "production", skip_upload_aab: true
  end

  private_lane :publish_notes do
    supply(skip_upload_apk: true, skip_upload_aab: true, skip_upload_images: true)
  end
end
