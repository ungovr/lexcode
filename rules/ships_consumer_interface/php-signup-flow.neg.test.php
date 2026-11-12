<?php
// lexcode-expect: 0
// What is not a public sign-up flow: an app's own Registered event for a course enrolment, its own
// CreatesNewUsers contract and Features class in another namespace, Fortify features other than
// registration, and staff creating accounts in an admin controller or a console command (a tool
// only staff use).
namespace App\Http\Controllers;

use App\Contracts\CreatesNewUsers;
use App\Events\Registered;
use App\Support\Features;
use Illuminate\Auth\Events\Registered as AccountRegistered;
use Illuminate\Console\Command;
use Laravel\Fortify\Features as FortifyFeatures;

class EnrolmentController extends Controller
{
    public function store(Request $request)
    {
        $enrolment = Enrolment::create($request->all());
        event(new Registered($enrolment));
        Registered::dispatch($enrolment);
        return back();
    }
}

class ImportStudents implements CreatesNewUsers
{
    public function create(array $input): Student
    {
        return Student::create($input);
    }
}

class FeatureFlags
{
    public static function enabled(): array
    {
        return [
            Features::registration(),
            FortifyFeatures::resetPasswords(),
            FortifyFeatures::updateProfileInformation(),
            FortifyFeatures::twoFactorAuthentication(['confirm' => true]),
        ];
    }
}

class AdminUserController extends Controller
{
    public function store(Request $request)
    {
        $user = User::create($request->all());
        event(new AccountRegistered($user));
        return redirect('/admin/users');
    }
}

class CreateUserCommand extends Command
{
    public function handle(): void
    {
        $user = User::create(['email' => $this->argument('email')]);
        event(new AccountRegistered($user));
    }
}
