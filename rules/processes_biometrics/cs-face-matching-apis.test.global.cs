// lexcode-expect: 2
// Amazon Rekognition with its namespace imported by a `global using` in another file, so this file has no
// using lines and only the vendor-named short forms find it: injected, and a client the method builds.
namespace Contoso.Access;

public sealed class GlobalFaceGate(IAmazonRekognition rekognition)
{
    public async Task RunAsync(string faceId)
    {
        await rekognition.SearchUsersAsync(new() { CollectionId = "staff", UserId = "u-1" });
        var client = new AmazonRekognitionClient();
        await client.StartFaceSearchAsync(new() { CollectionId = "staff" });
    }
}
