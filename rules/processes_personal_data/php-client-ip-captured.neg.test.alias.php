<?php
// lexcode-expect: 0
// Eloquent's Model imported under an alias, and the app's own Model base class (a request-scoped
// context that is never stored) used by the short name. The engine's `use X;` also matches
// `use X as Y;`, so the short-name branch has to step aside where the class is aliased.

namespace App\Support;

use App\Support\Base\Model;
use Illuminate\Database\Eloquent\Model as Eloquent;

class VisitContext extends Model
{
    public function capture($request): void
    {
        $this->last_ip = $request->ip();
    }
}
