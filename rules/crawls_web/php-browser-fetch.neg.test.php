<?php
// lexcode-expect: 0

namespace App\Billing;

use App\Http\Client;
use GuzzleHttp\Client as Guzzle;
use Psr\Container\ContainerInterface;

// No scraping browser is imported here. The project's own HTTP Client class shares the short name of
// the Goutte and Panther clients, and a Guzzle client calls a documented partner API, which is not
// crawling on its own.
class InvoiceSync
{
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
