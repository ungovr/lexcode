<?php
// lexcode-expect: 4

namespace App\Command;

use Symfony\Component\Panther\Client as PantherClient;

// A console command that opens other sites' pages in a real browser with Symfony Panther.
final class SnapshotCommand
{
    private PantherClient $panther;

    public function __construct()
    {
        $this->panther = PantherClient::createChromeClient();
    }

    // Panther through an aliased import: BrowserKit style and WebDriver style.
    public function snapshot(string $url): string
    {
        $crawler = $this->panther->request('GET', $url);
        $this->panther->get($url);

        return $crawler->html();
    }

    // Panther written out in full, with no import.
    public function firefox(string $pageUrl): void
    {
        $client = \Symfony\Component\Panther\Client::createFirefoxClient();
        $client->request('GET', $pageUrl);
        $client->get('https://news.example.com/');
    }

    // Loopback and relative targets, and a service lookup: not counted.
    public function local(): void
    {
        $client = \Symfony\Component\Panther\Client::createChromeClient();
        $client->get('http://localhost:9080/');
        $client->request('GET', '/dashboard');
        $client->get('/health');
        $settings = $this->settings->get('snapshot.width');
    }
}
