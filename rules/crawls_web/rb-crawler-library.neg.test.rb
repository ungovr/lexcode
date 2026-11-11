# lexcode-expect: 0
require "set"

# The project's own in-memory page graph: crawl, site and host walk it, no request is made.
class SiteGraph
  def initialize
    @nodes = { "home" => %w[about docs], "about" => [], "docs" => [] }
  end

  def crawl(start)
    @nodes.fetch(start, [])
  end

  def site(name)
    @nodes.key?(name)
  end

  def start_at(name)
    crawl(name)
  end
end

graph = SiteGraph.new
graph.crawl("home")
graph.site("docs")
graph.start_at("about")

# The project's own class that happens to be called Crawler, walking a tree of records.
class Crawler
  def self.crawl(root)
    root.children.flat_map { |child| [child, *crawl(child)] }
  end
end

Crawler.crawl(Category.root)

# A hostname helper: host is a plain string here, not a crawler call.
class Domain
  def self.host(name)
    name.to_s.downcase
  end

  def self.domain(name)
    host(name).split(".").last(2).join(".")
  end
end

Domain.host("Example.COM")
Domain.domain("www.example.com")

# Spidr, Anemone and Medusa are only named in a comment or a string here.
NOTE = "we replaced Anemone.crawl with a job queue".freeze
