// lexcode-expect: 7
// An email address or phone number a person supplies, validated as one: data-annotations
// attributes on a form model and a request record, and FluentValidation rules.
using System.ComponentModel.DataAnnotations;
using FluentValidation;
using DA = System.ComponentModel.DataAnnotations;

namespace Demo.Forms;

public class RegisterModel
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = "";

    [Phone]
    public string? Mobile { get; set; }

    [DA.EmailAddress(ErrorMessage = "Enter a valid address")]
    public string? BackupEmail { get; init; }

    [Required, StringLength(100)]
    public string DisplayName { get; set; } = "";
}

public record ContactRequest([EmailAddress] string From, [Required] string Message);

public record CallbackRequest(string Name, [Phone] string Number);

public class RegisterValidator : AbstractValidator<RegisterModel>
{
    public RegisterValidator()
    {
        RuleFor(m => m.Email).NotEmpty().EmailAddress();
        RuleFor(m => m.BackupEmail).EmailAddress().When(m => m.BackupEmail is not null);
        RuleFor(m => m.DisplayName).NotEmpty().MaximumLength(100);
    }
}
