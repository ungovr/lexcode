<?php
// lexcode-expect: 0

namespace App\Sitemap;

use App\Sitemap\Base\BasicSpider;
use App\Sitemap\Base\Crawler;
use App\Sitemap\Base\HttpCrawler;
use App\Sitemap\Base\Roach;
use Crwlr\Crawler\HttpCrawler as CrwlrCrawler;
use RoachPHP\Roach as RoachRunner;
use RoachPHP\Spider\BasicSpider as RoachSpider;
use Spatie\Crawler\Crawler as SpatieCrawler;

// The frameworks imported under aliases, and the app's own classes of the same short names (a
// sitemap builder that walks the app's own routes) used by those names. The engine's `use X;` also
// matches `use X as Y;`, so each short-name branch has to step aside where the class is aliased.
class SitemapCommand
{
    public function handle(): void
    {
        Crawler::create()->walkRoutes();
        Roach::startSpider(RouteSpider::class);
    }
}

class RouteSpider extends BasicSpider
{
}

class RouteCrawler extends HttpCrawler
{
}
