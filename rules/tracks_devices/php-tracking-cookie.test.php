<?php
// lexcode-expect: 10
// Cookies written with a name that marks them as analytics, advertising or visitor-identifier
// cookies: plain PHP, Laravel and Symfony.

namespace App\Http\Middleware;

use Illuminate\Support\Facades\Cookie as CookieJar;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Cookie as HttpCookie;
use Symfony\Component\HttpFoundation\Response;

class AssignVisitor
{
    public function handle($request, \Closure $next): Response
    {
        $id = bin2hex(random_bytes(16));

        // Plain PHP.
        setcookie('visitor_id', $id, time() + 31536000, '/');
        setrawcookie('_fbp', 'fb.1.' . time() . '.' . $id);

        // Laravel: the helper, the facade (aliased and fully qualified) and the response.
        $first = cookie('tracking_id', $id, 525600);
        CookieJar::queue('anonymous_id', $id, 525600);
        \Illuminate\Support\Facades\Cookie::forever('_ga', 'GA1.1.' . $id);
        \Cookie::queue('ajs_anonymous_id', $id, 525600);
        $response = $next($request);
        $response->cookie(
            'device_uuid',
            $id,
            525600,
        );

        // Symfony: the cookie class, imported, aliased and fully qualified.
        $response->headers->setCookie(Cookie::create('_gcl_au', $id));
        $response->headers->setCookie(new HttpCookie('browser_id', $id));
        $response->headers->setCookie(new \Symfony\Component\HttpFoundation\Cookie('fingerprint', $id));

        return $response;
    }
}
