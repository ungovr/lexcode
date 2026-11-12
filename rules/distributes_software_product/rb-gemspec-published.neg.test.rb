# lexcode-expect: 0
# Ruby code that reads, looks up or lists installed gems or sets up an application, with no gem
# specification of its own: a Rails app that is run, not shipped, and a service used through a
# browser or an API.
require_relative "boot"

require "rails"
require "active_record/railtie"
require "action_controller/railtie"
require "rubygems"

Bundler.require(*Rails.groups)

module Gradebook
  class Application < Rails::Application
    config.load_defaults 7.1
    config.time_zone = "Pacific Time (US & Canada)"
    config.autoload_paths << Rails.root.join("lib")
    config.generators.system_tests = nil
    config.x.support_url = "https://example.org/support"
    config.x.license = "internal use only"
  end
end

# Looking at the gems the app runs on is not defining one.
class GemReport
  def versions
    Gem::Specification.map { |spec| [spec.name, spec.version.to_s] }.sort
  end

  def lookup(name)
    spec = Gem::Specification.find_by_name(name)
    { name: spec.name, homepage: spec.homepage, license: spec.license, bindir: spec.bindir }
  end

  def loaded
    Gem.loaded_specs.values.select { |spec| spec.executables.any? }.map(&:name)
  end

  def requirement
    Gem::Requirement.new("~> 3.1").satisfied_by?(Gem::Version.new(RUBY_VERSION))
  end
end

# An ordinary value object with fields that share names with gemspec attributes.
class Vendor
  attr_accessor :homepage, :license, :executables, :metadata

  def configure(site)
    self.homepage = site.url
    self.license = site.plan
    self.executables = site.jobs.map(&:name)
    self.metadata = { "source" => site.id }
    metadata["source_code_uri"] = site.repo
  end
end

# A Gemfile pulls in the gem built in this repository, which is the application's own library.
gemspec
gem "pg", "~> 1.5"
