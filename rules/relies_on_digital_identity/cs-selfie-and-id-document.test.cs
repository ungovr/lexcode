// lexcode-expect: 6
using Microsoft.AspNetCore.Mvc;

namespace MyShop.Kyc;

// A request model with both images
public class KycSubmission
{
    public IFormFile SelfieImage { get; set; } = null!;                                   // 1
    public IFormFile IdDocumentFront { get; set; } = null!;
    public string? Country { get; set; }
}

// The ID document first, then the face
public class PassportCheck
{
    public byte[] PassportPhoto { get; set; } = [];
    internal byte[] FaceCapture = [];                                                     // 6
}

// A positional record, either order
public record KycUpload(IFormFile PassportScan, string Name, IFormFile Selfie);           // 2

// A controller action that takes both
public class KycController : ControllerBase
{
    [HttpPost("kyc")]
    public IActionResult Upload(IFormFile selfie, string name, IFormFile idCard)          // 3
    {
        return Ok();
    }

    [HttpPost("liveness")]
    public async Task<IActionResult> Liveness(IFormFile driversLicenseFront, IFormFile livenessVideo) // 4
    {
        await Task.Yield();
        return Ok();
    }
}

// A minimal API endpoint that takes both
public static class KycEndpoints
{
    public static void Map(WebApplication app)
    {
        app.MapPost("/kyc", (IFormFile faceImage, IFormFile photoIdFront) => Results.Ok()); // 5
    }
}
