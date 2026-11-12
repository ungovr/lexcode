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

// A face member beside an ID-document name that is no member: a local, a local with a type, a
// constant table, a default parameter and a returned parameter.
public class AvatarService
{
    public IFormFile Selfie { get; set; } = null!;

    public void Render(object doc)
    {
        var documentScan = Load(doc);
        Use(documentScan);
    }

    private object Load(object d) => d;
    private void Use(object o) { }
}

public class Gallery
{
    public IFormFile FaceImage { get; set; } = null!;

    public void Run(object x)
    {
        string idImage = "none";
    }
}

public class UploadNames
{
    public IFormFile Selfie { get; set; } = null!;
    public const string ID_CARD = "id_card";
    public const string PASSPORT_SCAN = "passport";
}

public class Defaults
{
    public IFormFile Selfie { get; set; } = null!;
    public void Upload(IFormFile file, string idCard = "x") { }
}

public class WithMethodUse
{
    public IFormFile Selfie { get; set; } = null!;

    public IFormFile Pick(IFormFile idCard)
    {
        return idCard;
    }
}

public static class UploadKinds
{
    public const string SELFIE = "selfie";
    public const string ID_CARD = "id_card";
}
