<?php
// lexcode-expect: 4

namespace App\Console;

use Crwlr\Crawler\HttpCrawler;
use Crwlr\Crawler\UserAgents\BotUserAgent;
use Crwlr\Crawler\UserAgents\UserAgentInterface;
use RoachPHP\Roach;
use RoachPHP\Spider\BasicSpider;
use Spatie\Crawler\Crawler;

// The same frameworks under plain imports.
class CrawlCommand
{
    public function handle(string $url, LinkObserver $observer): void
    {
        Crawler::create()->setCrawlObserver($observer)->startCrawling($url);
        Roach::startSpider(PriceSpider::class);
    }
}

class PriceSpider extends BasicSpider
{
    public array $startUrls = ['https://shop.example.com/'];
}

class StoreCrawler extends HttpCrawler
{
    protected function userAgent(): UserAgentInterface
    {
        return new BotUserAgent('StoreBot');
    }
}
