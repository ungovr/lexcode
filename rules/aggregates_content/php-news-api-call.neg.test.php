<?php
// lexcode-expect: 0

namespace App\Dashboard;

use App\News\NewsApi;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Http;

// The dashboard shows the app's own announcements and calls a documented weather API. The project's
// own NewsApi class shares the short name and the method names of the NewsAPI PHP client, and reads
// the app's own announcements.
class DashboardController
{
    public function __construct(private NewsApi $news, private Client $client)
    {
    }

    public function index(): array
    {
        $announcements = $this->news->getTopHeadlines('staff', null, 'us', null, 5, 1);
        $archive = (new NewsApi())->getEverything('release notes');
        $own = Http::get(url('/api/news/top-headlines'))->json();
        $weather = Http::get('https://api.openweathermap.org/data/2.5/weather', ['q' => 'Dublin'])->json();
        $status = $this->client->get('https://status.example.com/api/v2/summary.json');

        return compact('announcements', 'archive', 'own', 'weather', 'status');
    }
}
