<?php
// lexcode-expect: 0
// Third-party calls that carry no person's address, a literal address in a test helper, and the
// app's own Customer class with the library's short name.

namespace App\Billing;

use Stripe\StripeClient;

class Checkout
{
    public function __construct(private StripeClient $stripe)
    {
    }

    public function start(int $userId, string $priceId): string
    {
        // A checkout session keyed by an internal id, with no address.
        $session = $this->stripe->checkout->sessions->create([
            'line_items' => [['price' => $priceId, 'quantity' => 1]],
            'metadata' => ['billable_id' => $userId],
            'mode' => 'subscription',
        ]);

        // A customer with no address.
        $this->stripe->customers->create(['metadata' => ['team' => 'ops']]);

        return $session->url;
    }

    public function fixture(): void
    {
        // A literal example address, not a person's.
        $this->stripe->customers->create(['email' => 'test@example.com']);
    }

    public function local(string $email): void
    {
        // The app's own Customer class in this namespace, not Stripe's.
        Customer::create(['email' => $email]);
    }

    public function audience($mailchimp): array
    {
        // Reading a list's settings sends no address.
        return (array) $mailchimp->lists->getList('abc123');
    }

    public function policy(): string
    {
        // A content-security header that allows the host, not an avatar built from an address.
        return "img-src 'self' https://secure.gravatar.com";
    }
}

class Customer
{
    public static function create(array $attributes): self
    {
        return new self();
    }
}
