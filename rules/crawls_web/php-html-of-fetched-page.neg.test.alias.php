<?php
// lexcode-expect: 0

namespace App\Reports;

use App\Reports\Crawler;
use Symfony\Component\DomCrawler\Crawler as DomCrawler;

// Symfony's DomCrawler imported under an alias, and the app's own Crawler (a report that walks the
// fetched rows, not HTML) used by the short name. The engine's `use X;` also matches `use X as Y;`,
// so the short-name branches have to step aside where the class is aliased.
class StatusReport
{
    public function inline(string $statusUrl): Crawler
    {
        return new Crawler(file_get_contents($statusUrl));
    }

    public function assigned(string $statusUrl): Crawler
    {
        $rows = $this->httpClient->get($statusUrl);
        return new Crawler($rows);
    }
}
