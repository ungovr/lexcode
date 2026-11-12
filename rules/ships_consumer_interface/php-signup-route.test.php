<?php
// lexcode-expect: 9
// Public sign-up routes in Laravel through an aliased Route facade, the fully qualified facade, the
// global alias written with a leading backslash, and Livewire Volt pages (aliased and fully
// qualified), including one inside a guest-only group.
namespace App\Providers;

use Illuminate\Support\Facades\Route as Router;
use Illuminate\Support\ServiceProvider;
use Livewire\Volt\Volt as Page;

class RouteServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Router::get('/register', [RegisteredUserController::class, 'create'])->name('register');
        Router::post('register', [RegisteredUserController::class, 'store']);
        Router::match(['get', 'post'], 'sign-up', [SignupController::class, 'handle']);
        \Illuminate\Support\Facades\Route::view('/signup', 'auth.signup');
        \Route::get('auth/register', [RegisterController::class, 'showRegistrationForm']);
        \Illuminate\Support\Facades\Route::post(
            'api/v1/register',
            [ApiRegisterController::class, 'store'],
        );
        Page::route('register', 'pages.auth.register')->name('register');
        \Livewire\Volt\Volt::route('create-account', 'pages.auth.create-account');
        Router::middleware('guest')->group(function () {
            Router::get('users/sign-up', [SignupController::class, 'show']);
        });
    }
}
