<?php
// lexcode-expect: 0
// Authentication that is not a person's account, and lookalikes.

namespace App\Security;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Symfony\Component\Security\Core\User\UserInterface;

// The app's own interface with the library's short name, in another namespace.
interface PasswordAuthenticatedUserInterface
{
    public function getPassword(): ?string;
}

// A class that implements the app's interface, not Symfony's.
class LegacyAccount implements PasswordAuthenticatedUserInterface
{
    public function getPassword(): ?string
    {
        return null;
    }
}

// The app's own User model extended: the base class is not Laravel's authenticatable user.
class Moderator extends User
{
}

// A machine client signed in by an API token, with no password and no person behind it.
class ApiClient implements UserInterface
{
    public function __construct(private string $clientId)
    {
    }

    public function getRoles(): array
    {
        return ['ROLE_API'];
    }

    public function eraseCredentials(): void
    {
    }

    public function getUserIdentifier(): string
    {
        return $this->clientId;
    }
}

// A random key for an integration, stored on a plain model.
class Integration extends Model
{
    protected $fillable = ['name', 'api_key'];
}

// An anonymous daily total that can no longer be tied to anyone.
class DailySignupCount extends Model
{
    protected $fillable = ['day', 'count'];
}
