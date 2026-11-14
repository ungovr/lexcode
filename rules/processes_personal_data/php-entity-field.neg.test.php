<?php
// lexcode-expect: 0
// Doctrine columns that hold no personal data, a personal-looking property that is not a
// column, and an app's own Column attribute with the library's short name.

namespace App\Entity;

use App\Grid\Column;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
class Newsletter
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private string $emailSubject;

    #[ORM\Column]
    private bool $emailVerified = false;

    // Computed for display only; never stored.
    private ?string $email = null;

    /**
     * @ORM\Column(type="integer")
     */
    private $sentCount;
}

// A table widget's column attribute, not a database column.
class ContactRow
{
    #[Column(label: 'Email')]
    public string $email;

    #[Column(label: 'Phone')]
    public string $phone;
}
