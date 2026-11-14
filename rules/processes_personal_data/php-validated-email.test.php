<?php
// lexcode-expect: 9
// An email address a person supplies, validated as one: Laravel validation rules and Symfony
// Validator constraints.

namespace App\Http\Controllers;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator as Check;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Constraints\Email;

class RegisterController
{
    public function store(Request $request): void
    {
        // Laravel: a controller's request validation, pipe string and list forms.
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'backup_email' => ['nullable', 'email:rfc,dns'],
        ]);

        // Laravel: the Validator facade through an alias, and fully qualified. The data array
        // (the first argument) is not a rule.
        $first = Check::make($request->all(), [
            'email' => ['required', 'string', 'email', 'max:255'],
        ]);
        $second = \Illuminate\Support\Facades\Validator::make(['email' => $request->input('to')], [
            'email' => 'required|email',
        ]);
    }
}

// Laravel: a form request's rules.
class InviteRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'invitee' => 'required|email',
        ];
    }
}

// Symfony: the Email constraint as an attribute (aliased), fully qualified, and imported, and
// built in a form's constraints.
class ContactMessage
{
    #[Assert\NotBlank]
    #[Assert\Email]
    public string $from = '';

    #[\Symfony\Component\Validator\Constraints\Email(mode: 'strict')]
    public string $replyTo = '';

    #[Email]
    public string $cc = '';

    public function constraints(): array
    {
        return ['to' => [new Assert\Email(), new Assert\NotBlank()]];
    }
}
