// lexcode-expect: 0
package example.e2e;

import com.gargoylesoftware.htmlunit.WebClient;
import com.microsoft.playwright.Browser;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import java.io.IOException;
import java.util.List;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;

public class CheckoutFlowTest {
    private WebDriver driver = new ChromeDriver();
    private final String baseUrl = "http://localhost:8080";

    // One browser, one page, no loop: rendering a single page to check its title.
    public String title() {
        driver.get("https://shop.example.com/");
        return driver.getTitle();
    }

    public void single(String url) {
        driver.navigate().to(url);
        driver.findElement(By.id("buy")).click();
    }

    // A launched browser looping over the project's own pages on loopback.
    public void ownScreens(List<String> paths) {
        for (String path : paths) {
            driver.get("http://localhost:8080" + path);
            driver.get("http://127.0.0.1:8080" + path);
        }
    }

    public void ownScreensWithBase(List<String> paths) {
        for (String path : paths) {
            driver.get(baseUrl + path);
            driver.navigate().to(baseUrl + "/reports/" + path);
        }
    }

    public void ownFormatted(List<Integer> ports) {
        ports.forEach(port -> driver.get(String.format("http://localhost:%d/health", port)));
    }

    public void playwrightOwn(List<String> routes) {
        try (Playwright playwright = Playwright.create()) {
            Browser browser = playwright.chromium().launch();
            Page page = browser.newPage();
            for (String route : routes) {
                page.navigate("http://localhost:3000" + route);
                page.screenshot();
            }
        }
    }

    // Loops that never navigate: reading elements, collecting text.
    public void readRows(List<String> labels) {
        for (String label : labels) {
            driver.findElement(By.linkText(label)).click();
            System.out.println(driver.getCurrentUrl());
        }
    }

    // A map lookup named get, in a loop, on something that is not a browser.
    public void lookups(List<String> keys, java.util.Map<String, String> settings) {
        for (String key : keys) {
            settings.get(key);
        }
    }

    // A list of pages, indexed in a loop: the word "page" in a name is not a browser.
    public void indexed(List<String> itemsOnPage, List<String> pages, int last) {
        for (int i = 0; i < last; i++) {
            String first = itemsOnPage.get(i);
            String second = pages.get(first);
            System.out.println(second);
        }
    }

    public void navigation(androidx.navigation.NavController navController, List<String> routes) {
        for (String route : routes) {
            navController.navigate(route);
        }
    }

    public void htmlUnitSingle() throws IOException {
        WebClient client = new WebClient();
        client.getPage("https://example.com/");
    }
}
