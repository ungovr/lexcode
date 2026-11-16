<?php
// lexcode-expect: 0
// Encrypting only access-control data is authentication, not confidentiality (15 C.F.R. 772.1):
// Fortify's two-factor columns, sign-in and API tokens, API keys, a PIN, a login code and session
// data, as encrypted casts and as the encrypted collection cast class.

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\AsEncryptedCollection;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    protected $casts = [
        'two_factor_secret' => 'encrypted',
        'two_factor_recovery_codes' => 'encrypted:array',
        'remember_token' => 'encrypted',
        'otp_seed' => 'encrypted',
        'email' => 'string',
    ];
}

class Integration extends Model
{
    protected function casts(): array
    {
        return [
            'api_token' => 'encrypted',
            'apiKey' => 'encrypted',
            'webhook_secret' => "encrypted:collection",
            'card_pin' => 'encrypted',
            'login_code' => 'encrypted',
            'session_payload' => AsEncryptedCollection::class,
            'mfa_backup_codes' => AsEncryptedCollection::of(BackupCode::class),
            'legacy_pwd' => 'encrypted',
            'reset_code' => 'encrypted',
            'jwt_signing_key' => 'encrypted',
            'invite_code' => 'encrypted',
            'credentials' => 'encrypted:array',
            'session_id' => 'encrypted',
            'passwd' => 'encrypted',
        ];
    }
}
