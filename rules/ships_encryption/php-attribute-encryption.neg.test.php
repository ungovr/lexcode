<?php
// lexcode-expect: 0
// Models that store sensitive columns without encrypting them in the app: a hashed password cast,
// a boolean column that happens to be named encrypted, and the word as a value outside any cast
// list (a validation rule, a status). Last, the app's own cast class with the short name of
// Laravel's encrypted collection cast, in its own namespace.

namespace App\Models;

use App\Casts\AsEncryptedCollection;
use Illuminate\Database\Eloquent\Model;

class Account extends Model
{
    protected $fillable = ['email', 'status'];

    protected $casts = [
        'password' => 'hashed',
        'encrypted' => 'boolean',
        'settings' => 'array',
        'tags' => AsEncryptedCollection::class,
    ];

    protected function casts(): array
    {
        return [
            'verified_at' => 'datetime',
            'notes' => AsEncryptedCollection::of('string'),
        ];
    }

    public function rules(): array
    {
        return ['status' => 'encrypted', 'mode' => 'in:plain,encrypted'];
    }

    public function label(): string
    {
        $status = ['state' => 'encrypted'];
        return $status['state'];
    }
}
