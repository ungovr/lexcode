<?php
// lexcode-expect: 0
// A signature that is not a person signing an agreement: a webhook's HMAC signature, a release
// artifact's signature, an email signature block on a user profile, a key-signed attestation of a
// build, an HTTP authorization header's and a deployment approval's key signatures, a JWT's
// signature part, a signature passed to a method, and an agreement record whose fields are not a
// signature (its status, its text and whether the terms were accepted). Last, Laravel Artisan
// commands whose names hold an agreement word: $signature is the framework's command line, through
// the imported base class and the fully qualified one.

namespace App\Models;

use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Model;

class SendContractReminders extends Command
{
    protected $signature = 'contracts:remind {--days=3}';
    protected $description = 'Remind customers about unsigned contracts';
}

final class ExpireLeaseAgreements extends \Illuminate\Console\Command implements \Countable
{
    protected $signature = 'leases:expire';

    public function count(): int
    {
        return 0;
    }
}

class AuthorizationHeader
{
    public $credential;
    public $signature;
}

class DeploymentApproval
{
    public string $approver;
    private ?string $signature = null;
}

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
