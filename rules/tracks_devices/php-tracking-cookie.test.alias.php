<?php
// lexcode-expect: 2
// Symfony's HttpFoundation cookie under an aliased import, built and created, with names that mark
// a visitor identifier.

namespace App\EventSubscriber;

use Symfony\Component\HttpFoundation\Cookie as HttpCookie;

class VisitorCookie
{
    public function attach($response, string $id): void
    {
        $response->headers->setCookie(new HttpCookie('browser_id', $id));
        $response->headers->setCookie(HttpCookie::create('visitor_id', $id));
    }
}
