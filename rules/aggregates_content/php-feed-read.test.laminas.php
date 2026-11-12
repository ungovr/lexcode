<?php
// lexcode-expect: 7

namespace App\Aggregator;

use FeedIo\FeedIo;
use Laminas\Feed\Reader\Reader;
use Zend\Feed\Reader\Reader as ZendReader;

// A service that imports other publishers' feeds with the Laminas, Zend and feed-io readers.
class FeedImporter
{
    public function __construct(private FeedIo $feedIo)
    {
    }

    // Laminas under a plain import and written out in full. Laminas under an aliased import is in
    // php-feed-read.test.alias.php, because the short-name branch steps aside in a file that also
    // imports the class under an alias.
    public function laminas(string $url): void
    {
        $feed = Reader::import($url);
        $other = \Laminas\Feed\Reader\Reader::import('https://gazette.example.org/feed.atom');
        $remote = \Laminas\Feed\Reader\Reader::importRemoteFeed($url, $this->client);
    }

    // Zend through an aliased import, and written out in full.
    public function zend(string $url): void
    {
        $feed = ZendReader::import($url);
        $other = \Zend\Feed\Reader\Reader::import($url);
    }

    // feed-io, through the promoted property and through its factory.
    public function feedio(string $url): void
    {
        $result = $this->feedIo->read($url);
        $io = \FeedIo\Factory::create()->getFeedIo();
        $io->read('https://www.example-times.com/rss/world.xml');
    }
}
