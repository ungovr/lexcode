# lexcode-expect: 0
require "mechanize"

# A Mechanize agent that only talks to the project's own server on loopback.
class OwnSiteCheck
  def initialize
    @agent = Mechanize.new
  end

  def login_page_title
    @agent.get("http://localhost:3000/login").title
  end

  def health(port)
    @agent.get("http://127.0.0.1:#{port}/health").code
  end

  def dev_home
    agent = Mechanize.new
    agent.get("http://localhost:#{ENV.fetch('PORT', 3000)}/").title
  end

  def one_off
    Mechanize.new.get("http://localhost:3000/status").body
  end

  def block_style
    Mechanize.start { |a| a.get("http://localhost:3000/about").title }
  end
end

# A Mechanize agent built and never pointed at a page here: construction alone is not a fetch.
class LazyAgent
  def agent
    @agent ||= Mechanize.new
  end
end

# `.get` on other receivers that happen to live in a file that also builds an agent.
class Settings
  def read(config, key)
    config.get(key)
  end
end
