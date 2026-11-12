# lexcode-expect: 0
# Code that reads gem specifications or builds other objects with a similar name, and an
# application that is run rather than made available to others.
require "rubygems"

class VersionAudit
  def outdated(names)
    names.select do |name|
      spec = Gem::Specification.find_by_name(name)
      spec.version < Gem::Version.new("2.0")
    rescue Gem::MissingSpecError
      false
    end
  end

  def each_executable
    Gem::Specification.each { |spec| spec.executables.each { |exe| yield spec.name, exe } }
  end

  def dependency(name)
    Gem::Dependency.new(name, "~> 1.0")
  end
end

module Directory
  class Specification
    def self.new_for(name)
      new(name)
    end
  end
end

Directory::Specification.new("people") do |spec|
  spec.name = "people"
end

class ApplicationController < ActionController::Base
  def index
    @specs = Specification.new(params[:kind])
    render :index
  end
end
