// lexcode-expect: 2
using System.Dynamic;
using Abot.Crawler;

namespace Research.Harvest;

// Abot 1.x's PoliteWebCrawler built with an object initializer, by name and by target-typed new.
// (InfinityCrawler's Crawler has no settable member, so it has no initializer form to pin.)
public class LegacyHarvester
{
    public void Harvest(Uri site)
    {
        var crawler = new PoliteWebCrawler() { CrawlBag = new ExpandoObject() };
        crawler.Crawl(site);
        PoliteWebCrawler second = new() { CrawlBag = new ExpandoObject() };
    }
}
