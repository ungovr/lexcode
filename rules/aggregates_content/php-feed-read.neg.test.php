<?php
// lexcode-expect: 0

namespace App\Blog;

use App\Feeds\Reader;
use App\Http\Requests\LinkRequest;
use App\Models\Post;

// The blog publishes its own RSS feed outward and saves a link a user pastes in. It never reads
// another publisher's feed: the project's own Reader class shares the short name of the Laminas and
// Zend feed readers, and its own feed is read back only from disk or from its dev server.
class FeedController
{
    private string $feedPath = __DIR__ . '/../../public/feed.xml';

    // The site's own feed, built from its own posts.
    public function rss(array $posts): string
    {
        $xml = new \SimpleXMLElement('<rss version="2.0"><channel/></rss>');
        foreach ($posts as $post) {
            $item = $xml->channel->addChild('item');
            $item->addChild('title', htmlspecialchars($post->title));
            $item->addChild('link', $post->url);
        }
        file_put_contents($this->feedPath, $xml->asXML());

        return $xml->asXML();
    }

    // A single article link a user pastes in, saved and shown as a link.
    public function share(LinkRequest $request): Post
    {
        return Post::create(['title' => $request->input('title'), 'link' => $request->input('url')]);
    }

    // The project's own feed, read back from disk or from its own dev server.
    public function check(): bool
    {
        $own = simplexml_load_file($this->feedPath);
        $dev = simplexml_load_file('http://localhost:8000/feed.xml');
        $wp = fetch_feed('http://127.0.0.1:8080/feed/');
        $imported = Reader::import(__DIR__ . '/fixtures/sample.xml');

        return $own !== false && $dev !== false && $imported !== null;
    }
}
