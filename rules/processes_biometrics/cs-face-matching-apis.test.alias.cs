// lexcode-expect: 6
// Face-matching clients reached through namespace aliases, which only the fully qualified forms resolve:
// Azure AI Face identification on an injected FaceClient, enrollment on person-group and face-list
// clients, the older Face SDK's FaceClient built by the method, and Amazon Rekognition injected through
// its interface and built by the method.
using Legacy = Microsoft.Azure.CognitiveServices.Vision.Face;
using Rek = Amazon.Rekognition;
using Vf = Azure.AI.Vision.Face;

namespace Contoso.Access;

public sealed class AliasedFaceGate(Vf.FaceClient faces, Vf.LargePersonGroupClient staff, Vf.LargeFaceListClient visitors, Rek.IAmazonRekognition rekognition)
{
    public async Task RunAsync(Guid probe, Stream photo, Uri photoUrl, Legacy.ApiKeyServiceClientCredentials credentials)
    {
        await faces.IdentifyFromPersonDirectoryAsync(new[] { probe });
        await staff.AddFaceAsync(Guid.NewGuid(), BinaryData.FromStream(photo));
        await visitors.AddFaceFromUrlAsync(photoUrl);
        Legacy.FaceClient legacy = new(credentials);
        await legacy.Face.VerifyFaceToFaceAsync(probe, probe);
        await rekognition.IndexFacesAsync(new() { CollectionId = "staff" });
        Rek.AmazonRekognitionClient client = new();
        await client.SearchFacesAsync(new() { CollectionId = "staff", FaceId = probe.ToString() });
    }
}
