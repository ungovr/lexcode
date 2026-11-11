// lexcode-expect: 0
package example.feeds;

import com.apptasticsoftware.rssreader.Item;
import com.apptasticsoftware.rssreader.RssReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

// Reading the application's own feed, or a feed it already holds in memory.
public class OwnFeedChecks {

    public List<String> fromMemory(String xml) throws IOException {
        InputStream in = new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8));
        return new RssReader().read(in).map(Item::getTitle).map(t -> t.orElse("")).collect(Collectors.toList());
    }

    public List<String> fromDevServer() throws IOException {
        return new RssReader().read("http://localhost:8080/feed.xml").map(i -> i.getTitle().orElse("")).collect(Collectors.toList());
    }

    public List<String> fromLoopback() throws IOException {
        RssReader reader = new RssReader();
        return reader.read("http://127.0.0.1:8080/feed.xml").map(i -> i.getTitle().orElse("")).collect(Collectors.toList());
    }
}

class Settings {
    // A project class that has a read method of its own.
    String read(String key) {
        return key;
    }

    String name() {
        return read("https://example.org/not-a-feed");
    }
}

class FileLoader {
    java.util.stream.Stream<String> read(java.nio.file.Path path) throws IOException {
        return java.nio.file.Files.lines(path);
    }
}
