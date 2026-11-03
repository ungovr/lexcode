// lexcode-expect: 0
// Objects that have crawl, map or batchScrape methods but are not a scraping service.
class SiteGraph {
  nodes = new Map<string, string[]>();
  crawl(start: string): string[] {
    // Walks the project's own in-memory graph.
    return this.nodes.get(start) ?? [];
  }
  map(fn: (n: string) => string): string[] {
    return [...this.nodes.keys()].map(fn);
  }
}

const graph = new SiteGraph();
graph.crawl('home');
graph.map((n) => n.toUpperCase());

const lookup = new Map<string, number>();
export function find(k: string) {
  return lookup.get(k);
}
