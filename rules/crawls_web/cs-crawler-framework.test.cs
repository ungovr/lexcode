// lexcode-expect: 9
using Abot2.Crawler;
using Abot2.Poco;
using DotnetSpider;
using InfinityCrawler;
using TurnerSoftware.SitemapTools;

namespace Research.Harvest;

// A research crawler that harvests articles from news sites, on several crawling libraries.
public class ArticleHarvester(IWebCrawler injectedCrawler)
{
    public async Task HarvestAsync(string site)
    {
        // Abot2, constructed by name and by target-typed new, with and without an object initializer,
        // and injected.
        var crawler = new PoliteWebCrawler(new CrawlConfiguration { MaxPagesToCrawl = 500 });
        await crawler.CrawlAsync(new Uri(site));
        PoliteWebCrawler second = new(new CrawlConfiguration());
        var third = new PoliteWebCrawler(new CrawlConfiguration()) { ShouldCrawlPageDecisionMaker = (page, context) => new CrawlDecision { Allow = true } };
        PoliteWebCrawler fourth = new(new CrawlConfiguration()) { ShouldCrawlPageDecisionMaker = (page, context) => new CrawlDecision { Allow = true } };
        await injectedCrawler.CrawlAsync(new Uri(site));

        // InfinityCrawler.
        var walker = new Crawler();
        var result = await walker.Crawl(new Uri(site), new CrawlSettings { UserAgent = "ResearchBot" });

        // TurnerSoftware.SitemapTools, discovering every sitemap of another site.
        var sitemapQuery = new SitemapQuery();
        var sitemaps = await sitemapQuery.GetAllSitemapsForDomainAsync("news.example.com");
        var discovered = await sitemapQuery.DiscoverSitemapsAsync("news.example.com");
    }
}

// DotnetSpider: a spider class.
public class ArticleSpider : Spider
{
    public ArticleSpider(IOptions<SpiderOptions> options, DependenceServices services, ILogger<Spider> logger)
        : base(options, services, logger)
    {
    }
}
