<?php
// lexcode-expect: 0
// What is not a public sign-up route: a register page under an admin prefix, admin middleware or
// an admin group (a tool only staff use), a Symfony register route behind IsGranted or on an
// admin controller, a call to another service's register endpoint over HTTP (an API client, no
// screen of ours), a path that only starts with "register", and an app's own Route class in
// another namespace, which is not Laravel's facade.
namespace App\Http\Routes;

use App\Routing\Route;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Route as LaravelRoute;
use Symfony\Component\Routing\Attribute\Route as SymfonyRoute;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class RouteMap
{
    public function map(): void
    {
        LaravelRoute::prefix('admin')->group(function () {
            LaravelRoute::get('/register', [UserController::class, 'create']);
        });
        LaravelRoute::middleware(['auth', 'role:admin'])->group(function () {
            LaravelRoute::post('register', [UserController::class, 'store']);
        });
        LaravelRoute::group(['prefix' => 'staff', 'middleware' => 'auth'], function () {
            LaravelRoute::view('/signup', 'staff.signup');
        });
        LaravelRoute::get('/registered-courses', [CourseController::class, 'index']);
        // The app's own App\Routing\Route, a course-enrolment route table, not Laravel's.
        Route::get('register', 'enrolment.register');
    }

    public function partnerSignup(Client $http): void
    {
        $http->post('/register', ['json' => ['name' => 'Example']]);
        $http->get('https://partner.example.org/signup');
    }

    #[IsGranted('ROLE_ADMIN')]
    #[SymfonyRoute('/register', name: 'admin_register')]
    public function register(): Response
    {
        return new Response('');
    }

    #[SymfonyRoute('/users/register', name: 'admin_user_register')]
    #[IsGranted('ROLE_SUPPORT')]
    public function registerForCustomer(): Response
    {
        return new Response('');
    }

    // The app's own Route attribute (App\Routing\Route), which Symfony's router does not read.
    #[Route('/register', name: 'enrolment_register')]
    public function enrol(): Response
    {
        return new Response('');
    }

    #[SymfonyRoute('/registration-status', name: 'registration_status')]
    public function status(): Response
    {
        return new Response('');
    }
}

class AdminRegistrationController
{
    #[SymfonyRoute('/sign-up', name: 'admin_signup')]
    public function signup(): Response
    {
        return new Response('');
    }
}
