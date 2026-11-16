<?php
// lexcode-expect: 9
// Eloquent models whose columns Laravel encrypts on save: the encrypted casts in a $casts
// property and in a casts() method, and the encrypted collection and array-object cast classes,
// imported, aliased and fully qualified. Every column holds ordinary data; shipping_address only
// holds the letters of a short access-control word inside another word.

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\AsEncryptedArrayObject as EncryptedObject;
use Illuminate\Database\Eloquent\Casts\AsEncryptedCollection;
use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    protected $casts = [
        'ssn' => 'encrypted',
        'history' => 'encrypted:array',
        'name' => 'string',
        'contacts' => AsEncryptedCollection::class,
    ];
}

class Integration extends Model
{
    protected function casts(): array
    {
        return [
            'iban' => 'encrypted',
            'options' => EncryptedObject::class,
            'webhooks' => \Illuminate\Database\Eloquent\Casts\AsEncryptedCollection::of(Webhook::class),
            'enabled' => 'boolean',
            'addresses' => "encrypted:collection",
            'shipping_address' => 'encrypted',
            'session_notes' => 'encrypted',
        ];
    }
}
