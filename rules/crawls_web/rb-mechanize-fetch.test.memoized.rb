# lexcode-expect: 1
# The agent is memoized in a private method defined below the fetch that uses it, the usual
# service-object shape. Its own file, so this constructor is the file's only one.
require "mechanize"

class PriceWatcher
  def check(url)
    page = agent.get(url)
    page.search(".price").text
  end

  private

  def agent
    @agent ||= Mechanize.new { |a| a.user_agent_alias = "Mac Safari" }
  end
end
