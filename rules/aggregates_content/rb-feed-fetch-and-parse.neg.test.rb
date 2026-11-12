# lexcode-expect: 0
require "rss"
require "open-uri"
require "feedjira"

class OwnFeedChecks
  # Parses the project's own feed from disk or from its dev server on loopback.
  def from_disk
    RSS::Parser.parse(File.read("public/feed.xml"), false)
  end

  def from_response(response)
    RSS::Parser.parse(response.body)
  end

  def from_dev_server
    RSS::Parser.parse(URI.open("http://localhost:3000/feed.xml"), false)
  end

  def from_literal_dev_server
    RSS::Parser.parse("http://127.0.0.1:3000/feed.xml")
  end

  def legacy_dev_server
    Feedjira::Feed.fetch_and_parse("http://localhost:3000/feed.xml")
  end

  def inline
    RSS::Parser.parse(<<~XML, false)
      <?xml version="1.0"?>
      <rss version="2.0"><channel><title>Fixture</title></channel></rss>
    XML
  end
end

class Importer
  # The project's own importer, with the same method name as the library.
  def self.fetch_and_parse(path)
    JSON.parse(File.read(path))
  end

  # A documented partner API call for something that is not a feed.
  def rates
    JSON.parse(URI.open("https://api.exchangerate.host/latest").read)
  end
end

Importer.fetch_and_parse("data/seed.json")
