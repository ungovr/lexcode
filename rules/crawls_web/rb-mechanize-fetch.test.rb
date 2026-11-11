# lexcode-expect: 8
require "mechanize"

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
