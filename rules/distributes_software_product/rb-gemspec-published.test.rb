# lexcode-expect: 10
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

# What `bundle gem fresh` writes when no github username is configured: Bundler's own gemspec
# template (lib/bundler/templates/newgem/newgem.gemspec.tt), rendered with the generator's
# placeholders. Nothing in it is a hit: the homepage_uri line only restates spec.homepage, the
# links are TODO text, and the executables list is derived from the files.
Gem::Specification.new do |spec|
  spec.name = "fresh"
  spec.version = Fresh::VERSION
  spec.authors = ["TODO: Write your name"]
  spec.email = ["TODO: Write your email address"]

  spec.summary = "TODO: Write a short summary, because RubyGems requires one."
  spec.description = "TODO: Write a longer description or delete this line."
  spec.homepage = "TODO: Put your gem's website or public repo URL here."
  spec.license = "MIT"
  spec.required_ruby_version = ">= 3.2.0"
  spec.metadata["allowed_push_host"] = "TODO: Set to your gem server 'https://example.com'"
  spec.metadata["homepage_uri"] = spec.homepage
  spec.metadata["source_code_uri"] = "TODO: Put your gem's public repo URL here."
  spec.metadata["changelog_uri"] = "TODO: Put your gem's CHANGELOG.md URL here."

  # Uncomment the line below to require MFA for gem pushes.
  # spec.metadata["rubygems_mfa_required"] = "true"

  gemspec = File.basename(__FILE__)
  spec.files = IO.popen(%w[git ls-files -z], chdir: __dir__, err: IO::NULL) do |ls|
    ls.readlines("\x0", chomp: true).reject do |f|
      (f == gemspec) ||
        f.start_with?(*%w[bin/ Gemfile .gitignore])
    end
  end
  spec.bindir = "exe"
  spec.executables = spec.files.grep(%r{\Aexe/}) { |f| File.basename(f) }
  spec.require_paths = ["lib"]
end

# The same template rendered with a github username: homepage_uri still only restates the
# homepage (not a hit), while the source and changelog links are real URLs (two hits).
Gem::Specification.new do |spec|
  spec.name = "scaffolded"
  spec.version = Scaffolded::VERSION
  spec.homepage = "https://github.com/sam-example/scaffolded"
  spec.metadata["allowed_push_host"] = "TODO: Set to your gem server 'https://example.com'"
  spec.metadata["homepage_uri"] = spec.homepage
  spec.metadata["source_code_uri"] = "https://github.com/sam-example/scaffolded"
  spec.metadata["changelog_uri"] = "https://github.com/sam-example/scaffolded/blob/main/CHANGELOG.md"
  spec.executables = spec.files.grep(%r{\Aexe/}) { |f| File.basename(f) }
end

# An empty executables list declares no command-line program: not a hit.
Gem::Specification.new do |s|
  s.name = "library-only"
  s.executables = []
end

Gem::Specification.new do |s|
  s.name = "library-only-words"
  s.executables = %w[]
end
