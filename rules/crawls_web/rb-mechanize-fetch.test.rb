# lexcode-expect: 9
require "mechanize"

# The first constructor in this file, split from its receiver by a comment line: the engine reads
# only the part of a file after the first Mechanize constructor, so every line below depends on
# the anchor admitting this one.
class ResidualShapesMechanize
  def run(url)
    agent = Mechanize # a scriptable browser
      .new
    agent.get(url)
  end
end

# Mechanize is a scriptable browser: it fetches pages, follows links and submits forms.
class PortalReader
  def initialize
    @agent = Mechanize.new
    @agent.user_agent_alias = "Mac Safari"
  end

  def titles(url)
    @agent.get(url).search("h1").map(&:text)
  end

  def council_agenda
    page = @agent.get("https://www.example-council.org/agendas")
    page.links_with(text: /Agenda/)
  end
end

class OneOffs
  def local_agent(url)
    agent = Mechanize.new
    agent.get(url).title
  end

  def inline(url)
    Mechanize.new.get(url).body
  end

  def block_style(url)
    Mechanize.start { |agent| agent.get(url).title }
  end
end

# Shapes the anchor must admit: a leading-dot chain, a trailing dot and safe navigation.
class ChainShapesMechanize
  def run(url)
    agent = Mechanize
      .new
    agent&.get(url)
    agent
      .get(url)
    agent.
      get(url)
  end
end
