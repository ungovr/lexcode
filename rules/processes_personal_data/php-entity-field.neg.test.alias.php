<?php
// lexcode-expect: 0
// Doctrine's Column attribute imported under an alias, and the app's own Column attribute (a
// spreadsheet export's column heading) used by the short name. The engine's `use X;` also matches
// `use X as Y;`, so the short-name branch has to step aside where the class is aliased.

namespace App\Export;

use App\Export\Attribute\Column;
use Doctrine\ORM\Mapping\Column as OrmColumn;

final class ContactRow
{
    #[Column('Phone')]
    public string $phone;
}
