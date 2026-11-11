# lexcode-expect: 0
# Classes and modules that look like crawler frameworks but are the project's own.
module Crawlable
  def crawl_budget
    10
  end
end

class SpiderWeb < ApplicationRecord
  include Crawlable

  # A model for the project's own table of arachnid sightings.
  has_many :sightings
end

class Base
  def run
    :ok
  end
end

class Scraper < Base
  # A report builder that reads the project's own database.
  def parse(rows)
    rows.map { |r| r.fetch(:name) }
  end
end

class Cargo < ApplicationRecord
  self.table_name = "shipping_cargo"
end

class Agent
  def initialize(name)
    @name = name
  end
end

Agent.new("support")

module Crawler
  def self.crawl(&block)
    block.call
  end
end

Crawler.crawl { puts "own helper" }

# A Mechanize-style wrapper of the project's own: same method names, no library.
class Mechanic
  def self.start(job)
    new.tap { |m| m.run(job) }
  end

  def run(job)
    job.call
  end
end

Mechanic.start(-> { :done })

# Wombat, Kimurai, Vessel and Mechanize appear only in a string.
HINT = "swap Wombat.crawl and Mechanize.new for a plain HTTP client".freeze
