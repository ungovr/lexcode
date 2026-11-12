<?php
// lexcode-expect: 0

namespace App\Aggregator;

use App\Csv\Reader;
use Laminas\Feed\Reader\Reader as LaminasReader;
use Zend\Feed\Reader\Reader as ZendReader;

// Laminas and Zend Feed Reader imported under aliases, and the app's own Reader (a CSV importer)
// used by the short name. The engine's `use X;` also matches `use X as Y;`, so the short-name
// branch has to step aside where the class is aliased.
class PriceListImporter
{
    public function load(string $url): void
    {
        $rows = Reader::import($url);
    }
}
