<?php
// lexcode-expect: 0

namespace App\Mail;

use App\Html\Crawler;
use GuzzleHttp\Client;
use Psr\SimpleCache\CacheInterface;

// The app parses HTML it already holds (its own templates, stored posts, cached copies) and calls a
// documented partner API for JSON. Nothing here fetches another site's page and reads its HTML.
class NewsletterRenderer
{
    public function __construct(private CacheInterface $cache, private Client $client)
    {
    }

    public function template(string $templatePath): \DOMDocument
    {
        $dom = new \DOMDocument();
        @$dom->loadHTML(file_get_contents($templatePath));
        $dom->loadHTMLFile(__DIR__ . '/templates/footer.html');

        return $dom;
    }

    public function stored(Post $post, string $key): void
    {
        $dom = new \DOMDocument();
        $dom->loadHTML($post->body);
        $html = $this->cache->get($key);
        $dom->loadHTML($html);
        $dom->loadHTML($this->cache->get($key));
    }

    // The project's own Crawler class in another namespace, not Symfony's DomCrawler.
    public function own(string $pageUrl): array
    {
        return (new Crawler(file_get_contents($pageUrl)))->links();
    }

    // A documented partner API returning JSON, never parsed as HTML.
    public function stars(): int
    {
        $body = (string) $this->client->get('https://api.github.com/repos/laravel/laravel')->getBody();

        return json_decode($body, true)['stargazers_count'];
    }

    // The project's own dev server on loopback.
    public function preview(): void
    {
        $dom = new \DOMDocument();
        $dom->loadHTML(file_get_contents('http://localhost:8000/newsletter/preview'));
        $html = file_get_contents('http://127.0.0.1:8000/newsletter/preview');
        $dom->loadHTML($html);
    }
}
