<?php
// lexcode-expect: 8

namespace App\Research;

use Crwlr\Crawler\HttpCrawler as CrwlrCrawler;
use Crwlr\Crawler\UserAgents\BotUserAgent;
use Crwlr\Crawler\UserAgents\UserAgentInterface;
use RoachPHP\Http\Response;
use RoachPHP\Roach as RoachRunner;
use RoachPHP\Spider\BasicSpider as Spider;
use Spatie\Crawler\Crawler as SiteCrawler;

// A research crawler that harvests articles from other sites, built on three crawling frameworks.
class ArticleHarvester
{
    // Spatie's crawler through an aliased import, then written out in full.
    public function harvest(string $startUrl, ArticleObserver $observer): void
    {
        SiteCrawler::create()
            ->setCrawlObserver($observer)
            ->setMaximumDepth(3)
            ->startCrawling($startUrl);

        \Spatie\Crawler\Crawler::create(['timeout' => 10])->startCrawling('https://journal.example.org');
    }

    // Roach's runner through an aliased import, then written out in full.
    public function run(): array
    {
        RoachRunner::startSpider(ArticlesSpider::class);

        return \RoachPHP\Roach::collectSpider(ArticlesSpider::class);
    }
}

// Roach's spider base class through an aliased import.
class ArticlesSpider extends Spider
{
    public array $startUrls = ['https://journal.example.org/archive'];

    public function parse(Response $response): \Generator
    {
        yield $this->item(['title' => $response->filter('h1')->text()]);
    }
}

// Roach's spider base class written out in full.
final class FeedSpider extends \RoachPHP\Spider\BasicSpider
{
    public array $startUrls = ['https://gazette.example.com/'];
}

// crwlr's crawler through an aliased import.
class JournalCrawler extends CrwlrCrawler
{
    protected function userAgent(): UserAgentInterface
    {
        return new BotUserAgent('JournalBot');
    }
}

// crwlr's crawler written out in full.
class ArchiveCrawler extends \Crwlr\Crawler\HttpCrawler
{
    protected function userAgent(): UserAgentInterface
    {
        return new BotUserAgent('ArchiveBot');
    }
}
