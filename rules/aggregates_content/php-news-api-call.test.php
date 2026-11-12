<?php
// lexcode-expect: 7

namespace App\Headlines;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Http;
use jcobhams\NewsApi\NewsApi as NewsClient;

// A headlines page that pulls articles and snippets from third-party news APIs.
class HeadlineService
{
    public function __construct(private Client $client)
    {
    }

    public function laravel(string $country): array
    {
        return Http::get('https://newsapi.org/v2/top-headlines', ['country' => $country])->json('articles');
    }

    public function guzzle(string $section): array
    {
        $gnews = new Client(['base_uri' => 'https://gnews.io/api/v4/']);
        $nyt = $this->client->get("https://api.nytimes.com/svc/topstories/v2/{$section}.json");
        $guardian = $this->client->get('https://content.guardianapis.com/search', ['query' => ['q' => $section]]);

        return [$gnews, $nyt, $guardian];
    }

    public function curl(string $q): string
    {
        $ch = curl_init("https://api.thenewsapi.com/v1/news/all?search=" . urlencode($q));

        return (string) curl_exec($ch);
    }

    // The NewsAPI PHP client through an aliased import, then written out in full.
    public function client(string $key): array
    {
        $news = new NewsClient($key);
        $top = $news->getTopHeadlines(null, null, 'ie', 'technology', 20, 1);
        $all = (new \jcobhams\NewsApi\NewsApi($key))->getEverything('artificial intelligence');

        return [$top, $all];
    }
}
