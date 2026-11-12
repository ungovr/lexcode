<?php
// lexcode-expect: 0
// Laravel's Cookie facade and Symfony's cookie imported under aliases, and the app's own Cookie (a
// recipe-card model of the bakery's catalogue) used by the short name with visitor-like names. The
// engine's `use X;` also matches `use X as Y;`, so the short-name branches have to step aside where
// the class is aliased.

namespace App\Catalogue;

use App\Catalogue\Models\Cookie;
use Illuminate\Support\Facades\Cookie as CookieJar;
use Symfony\Component\HttpFoundation\Cookie as HttpCookie;

class Seeder
{
    public function run(string $id): void
    {
        Cookie::make('visitor_id', $id);
        Cookie::create('tracking_id', $id);
        $card = new Cookie('device_id', $id);
    }
}
