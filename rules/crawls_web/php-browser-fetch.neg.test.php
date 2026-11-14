<?php
// lexcode-expect: 0

namespace App\Billing;

use App\Http\Client;
use GuzzleHttp\Client as Guzzle;
use HeadlessChromium\BrowserFactory;
use Psr\Container\ContainerInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

// The project's own HTTP Client class shares the short name of the Goutte and Panther clients, and a
// Guzzle client calls a documented partner API, which is not crawling on its own. chrome-php is
// imported only to print the app's own pages to PDF, and its import does not admit another
// browser's request: the Symfony HttpClient call to Stripe below is an API call.
class InvoiceSync
{
    private string $appUrl = 'https://billing.example.com';

    private Client $client;
    private Guzzle $guzzle;

    public function __construct(private ContainerInterface $container)
    {
        $this->client = new Client('https://billing.internal.example.com');
        $this->guzzle = new Guzzle(['base_uri' => 'https://api.stripe.com/v1/']);
    }

    public function pull(string $invoiceId): array
    {
        $response = $this->client->request('GET', '/invoices/' . $invoiceId);
        $remote = $this->guzzle->request('GET', 'invoices/' . $invoiceId, ['auth' => [$this->key(), '']]);

        return [$response->toArray(), json_decode((string) $remote->getBody(), true)];
    }

    public function repo(): string
    {
        $client = new Guzzle();

        return (string) $client->get('https://api.github.com/repos/symfony/symfony')->getBody();
    }

    public function charges(HttpClientInterface $httpClient): array
    {
        return $httpClient->request('GET', 'https://api.stripe.com/v1/charges')->toArray();
    }

    // chrome-php rendering the app's own HTML and routes to PDF.
    public function pdf(string $path, string $html): void
    {
        $page = (new BrowserFactory())->createBrowser()->createPage();
        $page->navigate('file://' . $path)->waitForNavigation();
        $page->navigate('data:text/html;base64,' . base64_encode($html));
        $page->navigate(route('invoices.print', 1));
        $page->navigate($this->appUrl . '/invoices/1/print');
        $page->navigate("{$this->appUrl}/invoices/2/print");
        $page->navigate(config('app.url') . '/invoices/3/print');
        $page->navigate('/invoices/4/print');
        $page->pdf(['printBackground' => true])->saveToFile($path . '.pdf');
    }

    public function page(string $url): string
    {
        $browser = $this->container->get('app.renderer');

        return $browser->render($url);
    }

    private function key(): string
    {
        return (string) getenv('STRIPE_KEY');
    }
}
