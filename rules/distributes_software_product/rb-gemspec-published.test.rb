# lexcode-expect: 8
# Gem specifications that point at a registry page or declare an executable: source, changelog
# and documentation links, a MFA requirement for the registry, or a command-line program. Each hit
# is one such attribute inside Gem::Specification.new. A homepage or a license alone is not a hit
# (monorepo gems carry both), and neither is a link left as the generator's TODO placeholder.
require_relative "lib/feedlint/version"

Gem::Specification.new do |spec|
  spec.name          = "feedlint"
  spec.version       = Feedlint::VERSION
  spec.authors       = ["Sam Example"]
  spec.summary       = "Checks an RSS feed for common publishing mistakes"
  spec.homepage      = "https://example.org/feedlint"
  spec.license       = "MIT"

  spec.metadata["source_code_uri"] = "https://github.com/example/feedlint"
  spec.metadata["changelog_uri"] = "#{spec.homepage}/blob/main/CHANGELOG.md"
  spec.metadata["rubygems_mfa_required"] = "true"

  spec.files         = Dir["lib/**/*", "exe/*", "README.md"]
  spec.bindir        = "exe"
  spec.executables   = ["feedlint"]
  spec.require_paths = ["lib"]

  spec.add_dependency "nokogiri", "~> 1.16"
  spec.add_development_dependency "rspec", "~> 3.13"
end

Gem::Specification.new("feedlint-extras", "0.2.0") do |s|
  s.summary = "Extra checks for feedlint"
  s.licenses = ["Apache-2.0"]
  s.homepage = "https://example.org/feedlint-extras"
  s.metadata = { "homepage_uri" => "https://example.org/feedlint-extras" }
  s.executables << "feedlint-extras"
  s.add_dependency "feedlint"
end

Gem::Specification.new { |gem| gem.name = "tiny"; gem.metadata["source_code_uri"] = "https://example.org/tiny" }

Gem::Specification.new do |s|
  s.name = "tool"
  s.executables = %w[tool tool-admin]
end

# A freshly generated gemspec: placeholders and files-derived executables are not hits.
Gem::Specification.new do |spec|
  spec.name          = "fresh"
  spec.version       = "0.1.0"
  spec.homepage      = "TODO: Put your gem's website or public repo URL here."
  spec.license       = "MIT"
  spec.metadata["homepage_uri"] = "TODO: Put your gem's website or public repo URL here."
  spec.metadata["source_code_uri"] = "TODO: Put your gem's public repo URL here."
  spec.metadata["allowed_push_host"] = "https://gems.example.internal"
  spec.executables   = spec.files.grep(%r{\Aexe/}) { |f| File.basename(f) }
end
