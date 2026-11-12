<?php
// lexcode-expect: 6
// A public sign-up controller that fires Laravel's Registered event for the new account through
// the event helper (aliased import), through dispatch (fully qualified), and through new written
// fully qualified in an API handler, plus a Fortify action that creates the account a
// visitor registers (aliased contract) and Fortify's registration feature (aliased and fully
// qualified).
namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered as AccountRegistered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Laravel\Fortify\Contracts\CreatesNewUsers as CreatesUsers;
use Laravel\Fortify\Features as FortifyFeatures;

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
        event(new \Illuminate\Auth\Events\Registered($user));
        return response()->json($user, 201);
    }
}

class FortifyFeatureList
{
    public static function features(): array
    {
        return [
            FortifyFeatures::registration(),
            \Laravel\Fortify\Features::registration(),
            FortifyFeatures::resetPasswords(),
        ];
    }
}
