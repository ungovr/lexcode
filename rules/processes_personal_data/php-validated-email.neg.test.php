<?php
// lexcode-expect: 0
// The word email outside a validation rule, rules that do not check an address, and an app's own
// Validator and Assert classes with the library's short names.

namespace App\Http\Controllers;

use App\Validation\Rules as Assert;
use Illuminate\Http\Request;

// The app's own Assert attribute, imported under the alias Symfony's constraints usually take.
class NotificationSettings
{
    #[Assert\Email]
    public string $channel = 'email';
}

class SettingsController
{
    public function update(Request $request): array
    {
        // Rules that hold the word, but not the email rule.
        $request->validate([
            'notify_via' => 'required|in:email,sms',
            'email_opt_in' => 'boolean',
            'email_digest' => ['nullable', 'in:daily,weekly'],
        ]);

        // The app's own Validator class (this namespace, no import), not Laravel's facade.
        $check = Validator::make(['channel' => 'email'], ['channel' => 'email']);

        // A form field's type and a mail driver's name, not validation.
        return [
            'fields' => [['name' => 'contact', 'type' => 'email']],
            'mailer' => ['default' => 'email'],
        ];
    }
}
