<?php
// lexcode-expect: 5

namespace App\Scraping;

use Goutte\Client as GoutteClient;
use Symfony\Component\BrowserKit\HttpBrowser as Browser;
use Symfony\Component\HttpClient\HttpClient;

// A price-comparison scraper that loads other shops' product pages with Goutte and BrowserKit.
class ListingScraper
{
    public function __construct(private Browser $browser)
    {
    }

    // Goutte through an aliased import.
    public function prices(string $productUrl): array
    {
        $client = new GoutteClient();
        $crawler = $client->request('GET', $productUrl);

        return $crawler->filter('.price')->each(fn ($node) => $node->text());
    }

    // Goutte written out in full, with no import.
    public function catalog(): void
    {
        $client = new \Goutte\Client();
        $client->request(
            'GET',
            'https://shop.example.com/catalog?page=2'
        );
    }

    // BrowserKit's HttpBrowser through an aliased import, held in a promoted property.
    public function listing(string $url): string
    {
        return $this->browser->request('GET', $url)->filter('h1')->text();
    }

    // HttpBrowser written out in full, submitting a search form on another site.
    public function search(string $term): void
    {
        $browser = new \Symfony\Component\BrowserKit\HttpBrowser(HttpClient::create());
        $browser->request('POST', 'https://directory.example.org/search', ['q' => $term]);
        $browser->request('GET', "https://directory.example.org/results?q={$term}");
    }

    // The project's own dev server on loopback: not counted.
    public function health(): void
    {
        $client = new GoutteClient();
        $client->request('GET', 'http://localhost:8000/health');
        $client->request('GET', 'http://127.0.0.1:8000/ready');
        $client->request('GET', '/health');
    }

    // The HTTP client HttpBrowser is built on, calling a documented API: not counted.
    public function charges(\Symfony\Contracts\HttpClient\HttpClientInterface $httpClient): array
    {
        return $httpClient->request('GET', 'https://api.stripe.com/v1/charges')->toArray();
    }
}
