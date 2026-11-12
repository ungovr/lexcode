<?php
// lexcode-expect: 0
// Cookies the service needs (session, CSRF, remember-me, theme, language), tracking cookies read
// or removed but not written, and the app's own Cookie class with the library's short name.

namespace App\Http;

use Illuminate\Http\Request;
use Illuminate\Http\Response;

class Cookie
{
    public static function make(string $name, string $value, int $minutes = 0): array
    {
        return [$name, $value, $minutes];
    }
}

class PreferencesController
{
    public function save(Request $request, Response $response): Response
    {
        // The session that keeps one visit signed in, and the CSRF token.
        setcookie(session_name(), session_id(), ['httponly' => true, 'secure' => true]);
        setcookie('XSRF-TOKEN', csrf_token(), ['samesite' => 'Lax']);

        // Remember-me sign-in, and display preferences the visitor chose.
        setcookie('remember_web_59ba36addc2b2f94', $request->input('token'), time() + 604800);
        setcookie('REMEMBERME', $request->input('token'), time() + 604800);
        $response->cookie('theme', $request->input('theme'), 60 * 24 * 365);
        $response->cookie('locale', 'en', 60 * 24 * 365);

        // Reading an analytics cookie writes nothing.
        $clientId = $request->cookie('_ga');
        $other = $request->cookies->get('_gid');
        $raw = $_COOKIE['_fbp'] ?? null;

        // The app's own Cookie class in this namespace, not Laravel's facade.
        $pair = Cookie::make('visitor_id', 'x', 60);

        return $response;
    }
}
