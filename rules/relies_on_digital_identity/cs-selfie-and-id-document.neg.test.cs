// lexcode-expect: 0
using Microsoft.AspNetCore.Mvc;

namespace MyShop.Profiles;

// A selfie as a profile picture with no ID document (the ID document in the file belongs to another
// class), an ID document with no face, a local selfie variable, and constant names that hold no image.
public class TaxRecord
{
    public string IdDocumentNumber { get; set; } = "";
}

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

public class ScanQueue
{
    public IFormFile IdCardScan { get; set; } = null!;

    public ScanQueue(IFormFileCollection files)
    {
        IFormFile selfie = files[0];
    }
}

public static class UploadKinds
{
    public const string SELFIE = "selfie";
    public const string ID_CARD = "id_card";
}
