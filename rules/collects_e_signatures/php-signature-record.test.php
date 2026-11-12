<?php
// lexcode-expect: 8
// A signature a person drew or captured, stored on the record of an agreement, waiver or consent:
// a Doctrine waiver entity, a lease with the tenant's signature, a consent form with promoted
// constructor fields, a plain property, and an Eloquent agreement's fillable columns.

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Illuminate\Database\Eloquent\Model;

#[ORM\Entity]
class EventWaiver
{
    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $signatureImage = null;

    private string $participantName;
}

class LeaseAgreement
{
    private ?string $tenantSignature;
}

final class PhotoReleaseConsent
{
    public function __construct(public readonly string $guardian_signature, public readonly string $childName)
    {
    }
}

class PermissionSlip
{
    public $signature;
}

class RentalContract extends Model
{
    protected $fillable = ['unit', 'customer_signature', 'signature_svg', 'signed_at'];
}

// Authorization and Approval count in a person's form.
class MedicalAuthorizationForm
{
    private ?string $guardianSignature = null;
}

class ParentalApproval extends Model
{
    protected $fillable = ['student_id', 'parent_signature'];
}
