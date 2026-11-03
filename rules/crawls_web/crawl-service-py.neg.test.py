# lexcode-expect: 0
class SiteGraph:
    """The project's own in-memory page graph; crawl and map walk it, no request is made."""

    def __init__(self):
        self.nodes = {"home": ["about", "docs"], "about": [], "docs": []}

    def crawl(self, start):
        return self.nodes.get(start, [])

    def map_url(self, fn):
        return [fn(n) for n in self.nodes]


graph = SiteGraph()
graph.crawl("home")
graph.map_url(str.upper)
