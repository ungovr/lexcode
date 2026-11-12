<?php
// lexcode-expect: 0
// Laravel's encrypted cast class imported under an alias, and the app's own class of the same
// short name (a cast that only marks a column as redacted in exports) used by that name. The
// engine's `use X;` also matches `use X as Y;`, so the short-name branch has to step aside where the
// class is aliased.

namespace App\Models;

use App\Casts\AsEncryptedCollection;
use Illuminate\Database\Eloquent\Casts\AsEncryptedCollection as LaravelEncrypted;
use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    protected function casts(): array
    {
        return ['notes' => AsEncryptedCollection::class];
    }
}
