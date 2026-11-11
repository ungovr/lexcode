# lexcode-expect: 0
require "rss"
require "feedjira"

class OwnFeed
  # Generates the project's OWN feed from its own posts: a writer, not a reader.
  def build(posts)
    RSS::Maker.make("atom") do |maker|
      maker.channel.about = "https://blog.example.org/feed.atom"
      maker.channel.title = "Our blog"
      maker.channel.updated = Time.now.to_s
      posts.each do |post|
        maker.items.new_item do |item|
          item.link = "https://blog.example.org/#{post.slug}"
          item.title = post.title
          item.updated = post.updated_at.to_s
        end
      end
    end
  end
end

class LocalFeeds
  # Parses a file of the project's own posts that sits in the repository. Nothing is fetched.
  def posts
    Feedjira.parse(File.read("content/posts.xml")).entries.map(&:title)
  end

  def posts_from_rails_root
    Feedjira.parse(Rails.root.join("content", "posts.xml").read).entries
  end

  def posts_from_io
    Feedjira.parse(IO.read("content/posts.xml")).entries
  end

  def posts_from_stream
    Feedjira.parse(StringIO.new(File.read("content/posts.xml")).read).entries
  end

  def posts_from_pathname
    Feedjira.parse(Pathname.new("content/posts.xml").read).entries
  end

  def inline
    Feedjira.parse(<<~XML).entries
      <?xml version="1.0"?>
      <rss version="2.0"><channel><title>Fixture</title></channel></rss>
    XML
  end

  def inline_string
    Feedjira.parse('<rss version="2.0"><channel><title>Fixture</title></channel></rss>')
  end
end

class OwnParser
  # The project's own parser class that shares the method name with the libraries.
  def self.parse(text)
    text.split(",")
  end
end

OwnParser.parse("a,b,c")
