<?php
// lexcode-expect: 2

namespace App\Jobs;

use HeadlessChromium\BrowserFactory as Chrome;

// A queued job that renders other sites' pages in headless Chrome with chrome-php.
class RenderRemotePage
{
    public function __construct(private string $url)
    {
    }

    // chrome-php through an aliased import.
    public function handle(): string
    {
        $browser = (new Chrome())->createBrowser();
        $page = $browser->createPage();
        $page->navigate($this->url)->waitForNavigation();

        return $page->getHtml();
    }

    // chrome-php written out in full.
    public function other(): void
    {
        $browser = (new \HeadlessChromium\BrowserFactory('chromium'))->createBrowser();
        $browser->createPage()->navigate('https://example.com/pricing');
    }

    // The project's own server on loopback: not counted.
    public function local(): void
    {
        $browser = (new Chrome())->createBrowser();
        $browser->createPage()->navigate('http://127.0.0.1:8080/report');
    }
}
