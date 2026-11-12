# lexcode-expect: 4
# Rakefiles of gems: Bundler's gem tasks add `rake build`, `rake install` and `rake release`.
require "bundler/gem_tasks"
require "rspec/core/rake_task"

RSpec::Core::RakeTask.new(:spec)

task default: :spec

# Single quotes, parentheses and the older helper call are the same thing.
require 'bundler/gem_tasks'
require("bundler/gem_tasks")

namespace :gem do
  desc "Build and release the gem"
  task :publish do
    Bundler::GemHelper.install_tasks
    Rake::Task["release"].invoke
  end
end
