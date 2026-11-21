// lexcode-expect: 1
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;

namespace PriceWatch.Scraping;

// A star-slash inside a string after the using is not the end of a block comment: a glob, after a char
// literal on the same line that holds a double quote.
public class Shots
{
    public void Run(string url)
    {
        using IWebDriver driver = new ChromeDriver();
        driver.Navigate().GoToUrl(url);
        var quote = '"'; foreach (var f in Directory.GetFiles("shots", "**/*.png")) { File.Delete(f); }
    }
}
