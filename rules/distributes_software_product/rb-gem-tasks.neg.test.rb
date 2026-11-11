# lexcode-expect: 0
# A Rakefile for an application: tests, assets and database tasks, and Bundler requires that
# do not add release tasks.
require "bundler/setup"
require "bundler/audit/task"
require_relative "config/application"
require "rake/testtask"

Rails.application.load_tasks

Rake::TestTask.new do |t|
  t.libs << "test"
  t.pattern = "test/**/*_test.rb"
end

Bundler::Audit::Task.new

namespace :deploy do
  desc "Install gems for the release"
  task :bundle do
    sh "bundle install --deployment"
    Bundler.require(:default)
    Bundler.with_unbundled_env { sh "bundle exec rake assets:precompile" }
  end
end

task default: :test
