<?php
// lexcode-expect: 3
// A Laravel routes file (routes/auth.php has no namespace and no class) that imports the Route
// facade and the Volt facade by name.

use App\Http\Controllers\Auth\RegisteredUserController;
use Illuminate\Support\Facades\Route;
use Livewire\Volt\Volt;

Route::middleware('guest')->group(function () {
    Route::get('register', [RegisteredUserController::class, 'create'])
        ->name('register');
    Route::post('register', [RegisteredUserController::class, 'store']);
    Volt::route('registration', 'pages.auth.registration');
    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
});
