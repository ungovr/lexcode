<?php
// lexcode-expect: 13

namespace App\Scraping;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Http as Web;
use PHPHtmlParser\Dom;
use Symfony\Component\DomCrawler\Crawler as DomCrawler;

// A scraper that downloads other sites' pages and reads their HTML.
class PageReader
{
    public function __construct(private Client $client)
    {
    }

    // DOMDocument over a page fetched in the same expression, and over one fetched the line before.
    public function dom(string $url, string $pageUrl): void
    {
        $dom = new \DOMDocument();
        @$dom->loadHTML(file_get_contents($url));
        $dom->loadHTML((string) $this->client->get($url)->getBody());
        $html = file_get_contents($pageUrl);
        $dom->loadHTML($html);
        $dom->loadHTMLFile('https://example.org/listings.html');
    }

    // Symfony's DomCrawler through an aliased import, over Laravel's HTTP client.
    public function laravel(string $url): array
    {
        $crawler = new DomCrawler(Http::get($url)->body());
        $titles = (new DomCrawler(Web::get($url)->body()))->filter('h2')->each(fn ($n) => $n->text());

        return $titles;
    }

    // DomCrawler written out in full, over a page fetched the line before.
    public function full(string $url): \Symfony\Component\DomCrawler\Crawler
    {
        $body = Http::withHeaders(['User-Agent' => 'PriceBot'])
            ->timeout(10)
            ->get($url)
            ->body();

        return new \Symfony\Component\DomCrawler\Crawler($body);
    }

    // Laravel's HTTP client written out in full.
    public function facade(string $url): void
    {
        $dom = new \DOMDocument();
        $dom->loadHTML(\Illuminate\Support\Facades\Http::get($url)->body());
    }

    // simple_html_dom, paquettg/php-html-parser and the PHP 8.4 HTML document.
    public function parsers(string $listingUrl): void
    {
        $page = file_get_html($listingUrl);
        $other = str_get_html(file_get_contents('https://shop.example.com/deals'));
        $dom = (new Dom())->loadFromUrl($listingUrl);
        $doc = \Dom\HTMLDocument::createFromString(file_get_contents($listingUrl));
    }

    // WordPress's HTTP API.
    public function wordpress(string $url): void
    {
        $html = str_get_html(wp_remote_retrieve_body(wp_remote_get($url)));
    }
}
