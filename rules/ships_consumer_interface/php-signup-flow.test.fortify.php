<?php
// lexcode-expect: 4
// Laravel Fortify and Jetstream with public registration on: the Fortify contract imported by name
// and fully qualified, the registration feature in config/fortify.php through the Features class
// imported by name, and the Registered event imported by name.
namespace App\Actions\Fortify;

use Illuminate\Auth\Events\Registered;
use Laravel\Fortify\Contracts\CreatesNewUsers;
use Laravel\Fortify\Features;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    public function create(array $input): User
    {
        $user = User::create($input);
        Registered::dispatch($user);
        return $user;
    }
}

class CreateAccount implements \Laravel\Fortify\Contracts\CreatesNewUsers
{
    public function create(array $input): User
    {
        return User::create($input);
    }
}

class FortifyConfig
{
    public static function features(): array
    {
        return [
            Features::registration(),
            Features::resetPasswords(),
            Features::emailVerification(),
        ];
    }
}
