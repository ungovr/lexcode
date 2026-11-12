<?php
// lexcode-expect: 0

namespace App\Support;

use App\Indexing\BasicSpider;
use App\Indexing\HttpCrawler;
use App\Indexing\Roach;
use Symfony\Component\DomCrawler\Crawler;

// The project's own classes share the short names of the crawling frameworks' classes (Spatie's
// Crawler, Roach's BasicSpider and Roach, crwlr's HttpCrawler), and Symfony's DomCrawler parses
// HTML the app already holds. None of it fetches a page.
class SiteMapCrawler extends BasicSpider
{
    public function titles(string $html): array
    {
        $crawler = new Crawler($html);

        return $crawler->filter('h2')->each(fn (Crawler $node) => $node->text());
    }

    public function walk(): void
    {
        $tree = Crawler::create();
        \App\Support\Crawler::create()->startCrawling('/sitemap');
        Roach::startSpider(self::class);
    }
}

final class OwnPagesCrawler extends HttpCrawler
{
}

abstract class LocalSpider extends \App\Indexing\BasicSpider
{
}
