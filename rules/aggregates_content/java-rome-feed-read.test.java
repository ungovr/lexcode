// lexcode-expect: 8
package example.digest;

import com.rometools.fetcher.FeedFetcher;
import com.rometools.rome.feed.synd.SyndEntry;
import com.rometools.rome.feed.synd.SyndFeed;
import com.rometools.rome.io.FeedException;
import com.rometools.rome.io.SyndFeedInput;
import com.rometools.rome.io.XmlReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

// A reader that pulls headlines out of other publishers' feeds and keeps the links.
public class HeadlineReader {
    private static final List<String> FEEDS = List.of(
        "https://www.example-times.com/rss/world.xml",
        "https://gazette.example.org/feed.atom");

    public List<String> titles(String feedUrl) throws IOException, FeedException {
        SyndFeed feed = new SyndFeedInput().build(new XmlReader(new URL(feedUrl)));
        List<String> out = new ArrayList<>();
        for (SyndEntry entry : feed.getEntries()) {
            out.add(entry.getTitle() + " " + entry.getLink());
        }
        return out;
    }

    public SyndFeed literal() throws IOException, FeedException {
        SyndFeedInput input = new SyndFeedInput();
        return input.build(new XmlReader(new URL("https://www.example-times.com/rss/science.xml")));
    }

    public SyndFeed viaUri(String address) throws IOException, FeedException {
        return new SyndFeedInput().build(new XmlReader(URI.create(address).toURL()));
    }

    public SyndFeed viaStream(String address) throws IOException, FeedException {
        return new SyndFeedInput().build(new InputStreamReader(new URL(address).openStream()));
    }

    public SyndFeed viaConnection(String address) throws IOException, FeedException {
        HttpURLConnection conn = (HttpURLConnection) new URL(address).openConnection();
        conn.setRequestProperty("User-Agent", "digest/1.0");
        return new SyndFeedInput().build(new XmlReader(conn.getInputStream()));
    }

    public SyndFeed viaStreamField(String address) throws IOException, FeedException {
        SyndFeedInput input = new SyndFeedInput();
        input.setPreserveWireFeed(true);
        return input.build(new XmlReader(new URL(address).openStream()));
    }

    public SyndFeed viaFetcher(FeedFetcher fetcher, String address) throws Exception {
        return fetcher.retrieveFeed(new URL(address));
    }

    public SyndFeed viaFetcherLiteral(FeedFetcher fetcher) throws Exception {
        return fetcher.retrieveFeed(new URL("https://gazette.example.org/feed.atom"));
    }
}
