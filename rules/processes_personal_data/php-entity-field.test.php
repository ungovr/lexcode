<?php
// lexcode-expect: 6
// Stored Doctrine ORM columns for an email, a phone number, a date of birth and an IP address,
// as attributes (aliased import, plain import, fully qualified) and as docblock annotations.

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Mapping\Column;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity]
#[ORM\Table(name: 'app_user')]
class User
{
    #[ORM\Column(type: Types::STRING, unique: true)]
    #[Assert\Email]
    private ?string $email = null;

    #[ORM\Column(
        type: Types::STRING,
        length: 32,
        nullable: true,
    )]
    private ?string $phoneNumber = null;

    #[Column(type: Types::DATE_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $dateOfBirth = null;

    #[\Doctrine\ORM\Mapping\Column(length: 45, nullable: true)]
    private ?string $lastLoginIp = null;

    public function __construct(
        #[ORM\Column] private string $mobile = '',
    ) {
    }
}

/**
 * @ORM\Entity
 */
class Subscriber
{
    /**
     * @ORM\Column(type="string", length=180)
     */
    private $emailAddress;
}
