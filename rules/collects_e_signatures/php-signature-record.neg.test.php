<?php
// lexcode-expect: 0
// A signature that is not a person signing an agreement: a webhook's HMAC signature, a release
// artifact's signature, an email signature block on a user profile, a key-signed attestation of a
// build, a JWT's signature part, a
// signature passed to a method, and an agreement record whose fields are not a signature (its
// status, its text and whether the terms were accepted).

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebhookEvent extends Model
{
    protected $fillable = ['payload', 'signature'];
}

class ReleaseArtifact
{
    private ?string $signature = null;
    private string $version;
}

class UserProfile
{
    public $emailSignature;
    public string $displayName;
}

// A key's signature over a build artifact, named as an attestation.
class PgpSignedAttestation
{
    public $keyId;
    public $signature;
}

final class JwtParts
{
    public function __construct(public string $header, public string $payload, public string $signature)
    {
    }
}

class ServiceAgreement extends Model
{
    protected $fillable = ['status', 'terms_text', 'terms_accepted'];

    public ?string $status = null;

    public function verify(string $signature): bool
    {
        return hash_equals($this->status ?? '', $signature);
    }
}
