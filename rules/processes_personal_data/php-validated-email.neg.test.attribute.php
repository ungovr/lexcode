<?php
// lexcode-expect: 0
// Symfony's Email constraint imported under an alias, and the app's own Email attribute (it marks
// the property a report is sent from) used by the short name. The engine's `use X;` also matches
// `use X as Y;`, so the attribute's short-name branch has to step aside where the class is aliased.

namespace App\Reports;

use App\Reports\Attribute\Email;
use Symfony\Component\Validator\Constraints\Email as EmailConstraint;

final class Schedule
{
    #[Email]
    public string $sender = 'reports';
}
