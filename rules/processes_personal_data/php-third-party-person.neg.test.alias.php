<?php
// lexcode-expect: 0
// Stripe's Customer and Checkout Session imported under aliases, and the app's own Customer and
// Session models (rows in the app's own database) used by the short names. The engine's `use X;`
// also matches `use X as Y;`, so each short-name branch has to step aside where the class is aliased.

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Session;
use Stripe\Checkout\Session as CheckoutSession;
use Stripe\Customer as StripeCustomer;

class SignupController extends Controller
{
    public function store($request): void
    {
        Customer::create(['name' => $request->name, 'email' => $request->contact]);
        Session::create(['customer_email' => $request->contact, 'started_at' => now()]);
    }
}
