// lexcode-expect: 5
package example.digest;

import com.apptasticsoftware.rssreader.Item;
import com.apptasticsoftware.rssreader.RssReader;
import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

// A digest that reads other publishers' feeds with the rssreader library.
public class DailyDigest {
    private final RssReader reader = new RssReader();

    public List<Item> world() throws IOException {
        return new RssReader().read("https://www.example-times.com/rss/world.xml").collect(Collectors.toList());
    }

    public List<Item> byUrl(String feedUrl) throws IOException {
        return reader.read(feedUrl).collect(Collectors.toList());
    }

    public List<Item> localVar(String feedUrl) throws IOException {
        RssReader rssReader = new RssReader();
        return rssReader.read(feedUrl).collect(Collectors.toList());
    }

    public List<Item> many(List<String> urls) throws IOException {
        return reader.read(urls).collect(Collectors.toList());
    }

    public List<Item> perPublisher(String atomUrl) throws IOException {
        return new RssReader().read(atomUrl).sorted().collect(Collectors.toList());
    }
}
