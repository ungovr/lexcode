<?php
// lexcode-expect: 0

namespace App\Monitoring;

use App\Monitoring\Fakes\BrowserKit\HttpBrowser;
use App\Monitoring\Fakes\Goutte\Client;
use App\Monitoring\Fakes\HeadlessChromium\BrowserFactory;
use App\Monitoring\Fakes\Panther\Client as PantherClient;

// The app's own test doubles in namespaces that end in the browsers' own namespaces, which
// replay recorded pages. The file-text guards must not take the namespace suffix for the
// browser's namespace.
class ReplayCheck
{
    public function run(Client $client, HttpBrowser $browser, PantherClient $panther, BrowserFactory $factory): void
    {
        $client->request('GET', 'https://status.example.org/');
        $browser->request('GET', 'https://status.example.org/');
        $panther->get('https://status.example.org/');
        $page = $factory->createBrowser()->createPage();
        $page->navigate('https://status.example.org/');
    }
}
