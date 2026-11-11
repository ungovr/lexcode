// lexcode-expect: 11
package example.collect;

import com.gargoylesoftware.htmlunit.WebClient;
import com.microsoft.playwright.Browser;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;

// Headless browsers that open page after page.
public class ArticleCollector {
    private WebDriver driver;
    private Page page;
    private WebClient webClient = new WebClient();

    public List<String> collect(List<String> urls) {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless=new");
        WebDriver wd = new ChromeDriver(options);
        List<String> out = new ArrayList<>();
        for (String url : urls) {
            wd.get(url);
            out.add(wd.findElement(By.tagName("article")).getText());
        }
        wd.quit();
        return out;
    }

    public void walkListing() {
        for (int n = 1; n <= 40; n++) {
            driver.get("https://listings.example.org/results?page=" + n);
            driver.findElements(By.cssSelector("li.result")).forEach(WebElement::getText);
        }
    }

    public void follow(List<String> pages) {
        pages.forEach(pageUrl -> driver.navigate().to(pageUrl));
    }

    public void whileLoop(List<String> queue) {
        while (!queue.isEmpty()) {
            String next = queue.remove(0);
            driver.get(next);
        }
    }

    public void playwrightLoop(List<String> urls) {
        try (Playwright playwright = Playwright.create()) {
            Browser browser = playwright.chromium().launch();
            Page p = browser.newPage();
            for (String u : urls) {
                p.navigate(u);
            }
        }
    }

    public void playwrightField(List<String> links) {
        links.forEach(link -> page.navigate(link));
    }

    public void literalSites() {
        for (String slug : List.of("a", "b", "c")) {
            driver.get("https://prices.example.net/p/" + slug);
        }
    }

    public void htmlUnit(List<String> urls) throws IOException {
        for (String url : urls) {
            webClient.getPage(url);
        }
    }

    public void htmlUnitLambda(List<String> urls) {
        urls.forEach(url -> {
            try {
                webClient.getPage(url);
            } catch (IOException e) {
                throw new IllegalStateException(e);
            }
        });
    }

    public void doWhile(List<String> urls) {
        int i = 0;
        do {
            driver.get(urls.get(i++));
        } while (i < urls.size());
    }

    public void nextLink() {
        for (int i = 0; i < 100; i++) {
            driver.get(driver.findElement(By.cssSelector("a.next")).getAttribute("href"));
        }
    }
}
