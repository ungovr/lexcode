<?php
// lexcode-expect: 1

namespace App\Aggregator;

use Laminas\Feed\Reader\Reader as FeedReader;

// Laminas Feed Reader under an aliased import.
class FeedImporter
{
    public function laminas(string $url): void
    {
        $feed = FeedReader::import($url);
    }
}
