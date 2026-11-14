<?php
// lexcode-expect: 0
// Laravel's Validator facade and Symfony's Email constraint imported under aliases, and other
// classes of the same short names used by those names: Symfony Mime's Email (a message to send, not
// a check of an address), and the app's own Validator (a price-list checker whose 'email' rule names
// a supplier column's format). The engine's `use X;` also matches `use X as Y;`, so each short-name
// branch has to step aside where the class is aliased.

namespace App\Mail;

use App\Pricing\Validator;
use Illuminate\Support\Facades\Validator as ValidatorFacade;
use Symfony\Component\Mime\Email;
use Symfony\Component\Validator\Constraints\Email as EmailConstraint;

final class Notice
{
    public function build(array $row): Email
    {
        Validator::make($row, ['supplier' => 'email']);
        return (new Email())->subject('Price list updated');
    }
}
