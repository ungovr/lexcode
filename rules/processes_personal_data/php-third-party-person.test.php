<?php
// lexcode-expect: 9
// A person's email address, or a hash of it, sent to a third-party service: Stripe (the client,
// the static API, Checkout and Laravel Cashier), Mailchimp, and Gravatar.

namespace App\Services;

use Stripe\Checkout\Session;
use Stripe\Customer as StripeCustomer;
use Stripe\StripeClient;

class AccountSync
{
    public function __construct(private StripeClient $stripe, private $mailchimp)
    {
    }

    public function sync($user): void
    {
        // Stripe: the client's customers service.
        $this->stripe->customers->create([
            'email' => $user->email,
            'name' => $user->name,
        ]);
        $this->stripe->customers->update($user->stripe_id, ['email' => $user->email]);

        // Stripe: the static API, through an alias and fully qualified.
        StripeCustomer::create(['email' => $user->email]);
        \Stripe\Customer::create(['email' => $user->email, 'description' => 'web sign-up']);

        // Stripe Checkout, prefilled with the address, through the import and the client.
        Session::create(['customer_email' => $user->email, 'mode' => 'payment']);
        $this->stripe->checkout->sessions->create([
            'customer_email' => $user->email,
            'mode' => 'subscription',
        ]);

        // Laravel Cashier: the customer is created from the billable model's address.
        $user->createAsStripeCustomer();

        // Mailchimp Marketing: a list member.
        $this->mailchimp->lists->addListMember('abc123', [
            'email_address' => $user->email,
            'status' => 'subscribed',
        ]);
    }

    public function avatar($user): string
    {
        // Gravatar: the hash of the address goes to a third party.
        return 'https://www.gravatar.com/avatar/' . md5(strtolower(trim($user->email))) . '?s=80';
    }
}
