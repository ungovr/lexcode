# lexcode-expect: 3
# Gem specifications with no public face: a name, a version, files and dependencies. In a
# monorepo this is usually a library the application loads from its own gems/ directory, so it
# stays a signal until a registry link or a literal executable says it is published.
require_relative "lib/canvas_cache/version"

Gem::Specification.new do |spec|
  spec.name          = "canvas_cache"
  spec.version       = "1.0.0"
  spec.authors       = ["The Platform Team"]
  spec.summary       = "Cache helpers shared by the services in this repository"

  spec.files         = Dir.glob("{lib,spec}/**/*")
  spec.executables   = spec.files.grep(%r{^bin/}) { |f| File.basename(f) }
  spec.require_paths = ["lib"]

  spec.add_dependency "activesupport", ">= 7.1"
  spec.add_dependency "redis", "~> 5.0"
end

Gem::Specification.new("canvas_slug", "0.4.0") do |s|
  s.summary = "Slug generation"
  s.files = Dir["lib/**/*.rb"]
  s.add_dependency "i18n"
end

Gem::Specification.new { |s| s.name = "canvas_color"; s.version = "2.0.0"; s.files = [] }
