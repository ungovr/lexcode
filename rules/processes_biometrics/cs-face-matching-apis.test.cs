// lexcode-expect: 12
// Recognizing people from their faces through matching services: Azure AI Face identify, verify, find
// similar and enrollment (a client the method builds, one injected, a target-typed field, and the
// administration client aliased), liveness with verification, the older Face SDK, Amazon Rekognition
// (injected through its interface, and a client the method builds), and Face++ and Azure Face endpoints
// in strings.
using Amazon.Rekognition;
using Amazon.Rekognition.Model;
using Azure;
using Azure.AI.Vision.Face;
using Microsoft.Azure.CognitiveServices.Vision.Face;
using Admin = Azure.AI.Vision.Face;

namespace Contoso.Access;

public sealed class FaceGate(FaceSessionClient sessions, IAmazonRekognition rekognition, IFaceClient legacy)
{
    private const string FacePlusPlus = "https://api-us.faceplusplus.com/facepp/v3/compare";
    private const string AzureIdentify = "https://westus.api.cognitive.microsoft.com/face/v1.0/identify";

    private readonly Azure.AI.Vision.Face.FaceClient _faces = new(new Uri("https://contoso.cognitiveservices.azure.com/"), new AzureKeyCredential("key"));

    public async Task<bool> VerifyAsync(Guid probe, Guid enrolled, string personGroup)
    {
        var client = new Azure.AI.Vision.Face.FaceClient(new Uri("https://contoso.cognitiveservices.azure.com/"), new AzureKeyCredential("key"));
        var verify = await client.VerifyFaceToFaceAsync(probe, enrolled);
        var identify = await _faces.IdentifyFromLargePersonGroupAsync(new[] { probe }, personGroup);
        var similar = await _faces.FindSimilarAsync(probe, new[] { enrolled });
        var clusters = await _faces.GroupAsync(new[] { probe, enrolled });
        return verify.Value.IsIdentical;
    }

    public async Task EnrollAsync(Admin.FaceAdministrationClient admin, string groupId, Stream photo)
    {
        var group = admin.GetLargePersonGroupClient(groupId);
        await sessions.CreateLivenessWithVerifySessionAsync(new CreateLivenessWithVerifySessionContent(LivenessOperationMode.Passive), photo);
    }

    public async Task LegacyAsync(IList<Guid> faceIds, string groupId)
    {
        await legacy.Face.IdentifyAsync(faceIds, groupId);
        await legacy.PersonGroupPerson.AddFaceFromStreamAsync(groupId, Guid.NewGuid(), Stream.Null);
    }

    public async Task RekognitionAsync(Image probe, Image enrolled)
    {
        await rekognition.SearchFacesByImageAsync(new SearchFacesByImageRequest { CollectionId = "staff", Image = probe });
        using var client = new AmazonRekognitionClient();
        await client.CompareFacesAsync(new() { SourceImage = probe, TargetImage = enrolled, SimilarityThreshold = 90 });
    }
}
