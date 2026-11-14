// lexcode-expect: 5
using AbotCrawler = Abot.Crawler;
using Infinity = InfinityCrawler;
using Spiders = DotnetSpider;
using Sitemaps = TurnerSoftware.SitemapTools.SitemapQuery;

namespace Research.Harvest;

// The same libraries reached through aliases, Abot 1.x among them.
public class AliasedHarvester
{
    public async Task HarvestAsync(Uri site)
    {
        var crawler = new AbotCrawler.PoliteWebCrawler();
        crawler.Crawl(site);
        Infinity.Crawler walker = new();
        await walker.Crawl(site, new Infinity.CrawlSettings());
        await new Sitemaps().GetAllSitemapsForDomainAsync(site.Host);
        var query = new Sitemaps();
        await query.GetSitemapAsync(new Uri(site, "/sitemap.xml"));
    }
}

public class AliasedSpider : Spiders.Spider
{
}
