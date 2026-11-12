// lexcode-expect: 9
using Microsoft.AspNetCore.Http;

namespace MyShop.Kyc;

// A face member under every access modifier, with and without an initializer, beside an ID-document
// member (with an initializer too); a record and a struct with body members; a lambda that takes the
// ID document first.
public class KycProtected
{
    protected IFormFile Selfie;                                                           // 1
    protected IFormFile IdCard;
}

public class KycInternal
{
    internal IFormFile Selfie = null!;                                                    // 2
    internal IFormFile IdCard = null!;
}

public class KycPrivate
{
    private IFormFile FaceImage;                                                          // 3
    private IFormFile PassportScan;
}

public class KycPrivateInit
{
    private IFormFile PassportScan = null!;
    private IFormFile FaceImage = null!;                                                  // 4
}

public record KycRecord
{
    public IFormFile SelfieImage { get; init; } = null!;                                  // 5
    public IFormFile PassportScan { get; init; } = null!;
}

public struct KycStruct
{
    public IFormFile LivenessClip;                                                        // 6
    public IFormFile DriversLicenseFront;
}

public class KycProtectedInit
{
    protected IFormFile Selfie = null!;                                                   // 8
    protected IFormFile IdCard = null!;
}

public class KycInternalPlain
{
    internal IFormFile Selfie;                                                            // 9
    internal IFormFile IdCard;
}

public static class KycEndpoints
{
    public static void Map(WebApplication app)
    {
        app.MapPost("/kyc", (IFormFile idCard, IFormFile selfie) => Results.Ok());        // 7
    }
}
