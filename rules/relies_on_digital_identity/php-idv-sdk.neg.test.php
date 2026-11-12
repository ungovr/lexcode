<?php
// lexcode-expect: 0
// Signing a person in is not checking who they are: a password login, Laravel Socialite and an
// OAuth client that only link an account, and a passkey sign-in. Stripe used for payments and
// Checkout sits next to Stripe Identity without being it. Last, the app's own classes with the
// short names of the vendors' classes (VerificationSession, DefaultApi, the default name of every
// OpenAPI-generated client, YotiClient, DocScanClient), in its own namespaces, with no vendor import.

namespace App\Http\Controllers;

use App\Generated\DefaultApi;
use App\Kyc\DocScanClient;
use App\Kyc\YotiClient;
use App\Sms\VerificationSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use League\OAuth2\Client\Provider\GenericProvider;
use Stripe\Checkout\Session;
use Stripe\PaymentIntent;
use Stripe\StripeClient;

class SignInController
{
    public function login(Request $request)
    {
        return Auth::attempt($request->only('email', 'password'));
    }

    public function redirect()
    {
        return Socialite::driver('github')->redirect();
    }

    public function callback()
    {
        $user = Socialite::driver('github')->user();
        return $user->getEmail();
    }

    public function oauth(GenericProvider $provider, string $code)
    {
        return $provider->getAccessToken('authorization_code', ['code' => $code]);
    }

    public function passkey(object $webauthn, string $clientData, string $authenticatorData, string $signature)
    {
        return $webauthn->processGet($clientData, $authenticatorData, $signature, 'credential-public-key');
    }
}

class BillingController
{
    public function charge(StripeClient $stripe, int $amount)
    {
        $intent = PaymentIntent::create(['amount' => $amount, 'currency' => 'usd']);
        $session = Session::create(['mode' => 'subscription']);
        $customer = $stripe->customers->create(['email' => 'someone@example.org']);
        return [$intent, $session, $customer, $stripe->checkout->sessions->create(['mode' => 'payment'])];
    }

    public function own(): array
    {
        return [
            VerificationSession::create('sms'),
            new DefaultApi(),
            new YotiClient('sdk-id', 'key.pem'),
            new DocScanClient('sdk-id', 'key.pem'),
        ];
    }
}
