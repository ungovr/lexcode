<?php
// lexcode-expect: 8

namespace App\Digest;

use SimplePie\SimplePie as Pie;

// A news digest that pulls headlines from other publishers' RSS and Atom feeds.
class HeadlineDigest
{
    private const FEEDS = [
        'https://www.example-times.com/rss/world.xml',
        'https://gazette.example.org/feed.atom',
    ];

    // SimplePie through an aliased import, then written out in full, then the legacy global class.
    public function simplepie(string $feedUrl): array
    {
        $feed = new Pie();
        $feed->set_feed_url($feedUrl);
        $feed->init();

        $other = new \SimplePie\SimplePie();
        $other->set_feed_url(self::FEEDS);
        $other->init();

        $legacy = new \SimplePie();
        $legacy->set_feed_url(
            'https://www.example-times.com/rss/science.xml'
        );

        return $feed->get_items(0, 10);
    }

    // WordPress, which wraps SimplePie.
    public function wordpress(): void
    {
        $rss = fetch_feed('https://gazette.example.org/feed/');
        $items = fetch_feed(self::FEEDS);
    }

    // PHP's own XML reader, given a feed's address.
    public function plain(string $feedUrl): array
    {
        $channel = simplexml_load_file($feedUrl);
        $atom = simplexml_load_string(file_get_contents('https://gazette.example.org/feed.atom'));
        $rss = new \SimpleXMLElement('https://www.example-times.com/rss/world.xml', 0, true);

        return [$channel, $atom, $rss];
    }
}
