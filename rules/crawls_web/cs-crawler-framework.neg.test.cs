// lexcode-expect: 0
using Shop.Search.Indexing;

namespace Shop.Search;

// The app's own search indexer walks its own catalog in the database, and its own sitemap builder
// writes the sitemap of its own store. The classes share their short names with Abot's, InfinityCrawler's,
// DotnetSpider's and SitemapTools' in another namespace, so none of this is taken for a crawler
// visiting other sites.
public class CatalogIndexer(IWebCrawler indexer)
{
    public async Task RebuildAsync(Uri storeRoot)
    {
        var crawler = new PoliteWebCrawler();
        await crawler.CrawlAsync(storeRoot);
        PoliteWebCrawler second = new();
        var walker = new Crawler();
        await walker.Crawl(storeRoot, new CrawlSettings());
        await indexer.CrawlAsync(storeRoot);
        var sitemaps = new SitemapQuery();
        await sitemaps.GetAllSitemapsForDomainAsync(storeRoot.Host);
    }
}

// A product feed spider over the app's own database, on its own base class.
public class ProductSpider : Spider
{
    public override Task RunAsync() => Task.CompletedTask;
}
