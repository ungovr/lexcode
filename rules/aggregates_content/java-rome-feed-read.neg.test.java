// lexcode-expect: 0
package example.feeds;

import com.rometools.fetcher.FeedFetcher;
import com.rometools.rome.feed.synd.SyndEntry;
import com.rometools.rome.feed.synd.SyndEntryImpl;
import com.rometools.rome.feed.synd.SyndFeed;
import com.rometools.rome.feed.synd.SyndFeedImpl;
import com.rometools.rome.io.FeedException;
import com.rometools.rome.io.SyndFeedInput;
import com.rometools.rome.io.SyndFeedOutput;
import com.rometools.rome.io.XmlReader;
import java.io.File;
import java.io.IOException;
import java.io.StringReader;
import java.io.StringWriter;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import javax.servlet.http.HttpServletRequest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.web.multipart.MultipartFile;

// The application's own feed: producing it, reading it back from disk, and testing against loopback.
public class OwnFeed {

    public String publish(List<String> titles) throws IOException, FeedException {
        SyndFeed feed = new SyndFeedImpl();
        feed.setFeedType("rss_2.0");
        feed.setTitle("Release notes");
        feed.setLink("https://www.example.org/releases");
        feed.setDescription("What changed in each release");
        List<SyndEntry> entries = new ArrayList<>();
        for (String title : titles) {
            SyndEntry entry = new SyndEntryImpl();
            entry.setTitle(title);
            entries.add(entry);
        }
        feed.setEntries(entries);
        StringWriter out = new StringWriter();
        new SyndFeedOutput().output(feed, out);
        return out.toString();
    }

    public SyndFeed fromDisk(File file) throws IOException, FeedException {
        return new SyndFeedInput().build(new XmlReader(file));
    }

    public SyndFeed fromString(String xml) throws IOException, FeedException {
        SyndFeedInput input = new SyndFeedInput();
        return input.build(new StringReader(xml));
    }

    public SyndFeed fromUpload(HttpServletRequest request) throws IOException, FeedException {
        return new SyndFeedInput().build(new XmlReader(request.getInputStream()));
    }

    public SyndFeed fromDevServer() throws IOException, FeedException {
        return new SyndFeedInput().build(new XmlReader(new URL("http://localhost:8080/feed.xml")));
    }

    public SyndFeed fromLoopback() throws IOException, FeedException {
        return new SyndFeedInput().build(new XmlReader(new URL("http://127.0.0.1:8080/feed.xml")));
    }

    public SyndFeed fromOwnDevFetcher(FeedFetcher fetcher) throws Exception {
        return fetcher.retrieveFeed(new URL("http://localhost:8080/feed.xml"));
    }

    // Local resources that read through the same method names.
    public SyndFeed fromClasspath() throws IOException, FeedException {
        return new SyndFeedInput().build(new XmlReader(new ClassPathResource("sample-feed.xml").getInputStream()));
    }

    public SyndFeed fromFileUrl(File f) throws IOException, FeedException {
        return new SyndFeedInput().build(new XmlReader(f.toURI().toURL()));
    }

    public SyndFeed fromFileScheme(String path) throws IOException, FeedException {
        return new SyndFeedInput().build(new XmlReader(new URL("file:" + path)));
    }

    public SyndFeed fromFileSchemeStream() throws IOException, FeedException {
        return new SyndFeedInput().build(new XmlReader(new URL("file:/srv/feeds/seed.xml").openStream()));
    }

    public SyndFeed fromMultipart(MultipartFile upload) throws IOException, FeedException {
        return new SyndFeedInput().build(new XmlReader(upload.getInputStream()));
    }
}

class Importer {
    // The project's own method with a name the library also uses, called with a receiver.
    Object retrieveFeed(String path) {
        return path.trim();
    }

    Object run(Importer importer, Importer receiver) {
        importer.retrieveFeed("seed.xml");
        receiver.retrieveFeed("x");
        return this.retrieveFeed("seed.xml");
    }
}
