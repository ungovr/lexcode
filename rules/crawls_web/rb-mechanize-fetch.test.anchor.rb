# lexcode-expect: 1
# The only constructor in this file, split from its receiver by a comment line. The engine reads a
# file only when it builds a Mechanize agent, so this match depends on the anchor admitting it.
require "mechanize"

class ResidualShapesMechanize
  def run(url)
    agent = Mechanize # a scriptable browser
      .new
    agent.get(url)
  end
end
