// lexcode-expect: 0
using Microsoft.AspNetCore.Mvc;

namespace MyShop.Profiles;

// A selfie as a profile picture with no ID document, an ID document with no face, and constant
// names that hold no image.
public class ProfileForm
{
    public IFormFile Selfie { get; set; } = null!;
    public IFormFile CoverPhoto { get; set; } = null!;
    public string DisplayName { get; set; } = "";
}

public record TaxForm(string IdDocumentNumber, string Country);

public class ProfileController : ControllerBase
{
    public IActionResult Avatar(IFormFile selfie, string caption) => Ok();

    public IActionResult Address(IFormFile proofOfAddress, IFormFile idCard) => Ok();
}

public static class UploadKinds
{
    public const string SELFIE = "selfie";
    public const string ID_CARD = "id_card";
}
