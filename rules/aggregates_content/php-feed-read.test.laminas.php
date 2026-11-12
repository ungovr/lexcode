<?php
// lexcode-expect: 8

namespace App\Aggregator;

use FeedIo\FeedIo;
use Laminas\Feed\Reader\Reader;
use Laminas\Feed\Reader\Reader as FeedReader;
use Zend\Feed\Reader\Reader as ZendReader;

// A service that imports other publishers' feeds with the Laminas, Zend and feed-io readers.
class FeedImporter
{
    public function __construct(private FeedIo $feedIo)
    {
    }

    // Laminas under a plain import, an aliased import, and written out in full.
    public function laminas(string $url): void
    {
        $feed = Reader::import($url);
        $again = FeedReader::import($url);
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
