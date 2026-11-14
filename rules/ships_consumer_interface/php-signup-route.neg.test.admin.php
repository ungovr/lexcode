<?php
// lexcode-expect: 0
// A register route on a controller in an Admin namespace, where staff create accounts for
// others: a tool only staff use, though neither the class nor the route names admin.
namespace App\Controller\Admin;

use Illuminate\Support\Facades\Route;
use Symfony\Component\Routing\Attribute\Route as SymfonyRoute;

class UserController extends AbstractController
{
    #[SymfonyRoute('/register', name: 'user_new')]
    public function register(): Response
    {
        return new Response('');
    }

    public static function routes(): void
    {
        Route::get('signup', [self::class, 'register']);
    }
}
