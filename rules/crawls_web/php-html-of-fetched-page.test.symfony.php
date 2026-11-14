<?php
// lexcode-expect: 3

namespace App\Service;

use Symfony\Component\DomCrawler\Crawler;
use Symfony\Contracts\HttpClient\HttpClientInterface;

// A Symfony service that reads the HTML of other sites' pages, under a plain DomCrawler import.
final class CompetitorPrices
{
    public function __construct(private HttpClientInterface $httpClient)
    {
    }

    public function price(string $productUrl): string
    {
        $crawler = new Crawler($this->httpClient->request('GET', $productUrl)->getContent());

        return $crawler->filter('.price')->text();
    }

    public function stock(string $url): string
    {
        $crawler = new Crawler();
        $crawler->addHtmlContent($this->httpClient->request('GET', $url)->getContent());
        $content = $this->httpClient->request('GET', $url)->getContent();
        $page = new Crawler($content, $url);

        return $crawler->filter('.stock')->text() . $page->filter('h1')->text();
    }
}
