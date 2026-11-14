<?php
// lexcode-expect: 0

namespace App\Reports;

use HeadlessChromium\BrowserFactory;

// chrome-php renders the app's own invoice to PDF, and the same class calls a JSON API with a plain
// client. chrome-php's import admits only chrome-php's own page load (navigate), never another
// browser's request shape, so the API call is not read as a browser fetch.
class InvoicePdf
{
    public function __construct(private BrowserFactory $browsers, private object $api)
    {
    }

    public function render(string $html): string
    {
        $page = $this->browsers->createBrowser()->createPage();
        $page->setHtml($html);
        return $page->pdf()->getBase64();
    }

    public function rates(): array
    {
        return $this->api->request('GET', 'https://api.example.com/x')->toArray();
    }
}
