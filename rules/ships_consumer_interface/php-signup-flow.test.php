<?php
// lexcode-expect: 4
// A public sign-up controller that fires Laravel's Registered event for the new account through
// the event helper (aliased import), through dispatch (fully qualified), and in a second form
// handler, plus a Fortify action that creates the account a visitor registers (aliased contract).
namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered as AccountRegistered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Laravel\Fortify\Contracts\CreatesNewUsers as CreatesUsers;

class RegisteredUserController extends Controller
{
    public function store(Request $request)
    {
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);
        event(new AccountRegistered($user));

        return redirect('/dashboard');
    }

    public function storeFromInvite(Request $request)
    {
        $user = User::create($request->only('name', 'email'));
        \Illuminate\Auth\Events\Registered::dispatch(
            $user,
        );

        return redirect('/dashboard');
    }
}

class CreateNewUser implements CreatesUsers
{
    public function create(array $input): User
    {
        return User::create($input);
    }
}

class ApiSignup
{
    public function __invoke(Request $request)
    {
        $user = User::create($request->all());
        event(new AccountRegistered($user));
        return response()->json($user, 201);
    }
}
