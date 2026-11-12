// lexcode-expect: 0
// Faces found or photos handled without recognizing anyone: Azure AI Face detection, Amazon Rekognition
// face and label detection, a profile photo stored as uploaded, and a detection endpoint in a string.
// Look-alikes: the app's own FaceClient in another namespace with identify and verify methods, and an
// app service whose methods are named like Rekognition's.
using Amazon.Rekognition;
using Amazon.Rekognition.Model;
using Azure.Storage.Blobs;
using Contoso.Gallery;
using AzureFace = Azure.AI.Vision.Face;

namespace Contoso.Profiles;

public sealed class ProfilePhotoService(IAmazonRekognition rekognition, BlobContainerClient photos, PhotoMatcher matcher)
{
    private const string DetectUrl = "https://westus.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceId=false";

    public async Task SaveAsync(string userId, Stream upload, AzureFace.FaceClient azure)
    {
        var faces = await azure.DetectAsync(BinaryData.FromStream(upload), AzureFace.FaceDetectionModel.Detection03, AzureFace.FaceRecognitionModel.Recognition04, returnFaceId: false);
        await rekognition.DetectFacesAsync(new DetectFacesRequest { Image = new Image() });
        await rekognition.DetectLabelsAsync(new DetectLabelsRequest { Image = new Image() });
        await photos.UploadBlobAsync($"{userId}/avatar.jpg", upload);
    }

    public async Task LocalAsync(Guid faceId, Guid groupId)
    {
        var own = new FaceClient();
        await own.IdentifyFromLargePersonGroupAsync(faceId, groupId);
        await own.VerifyFaceToFaceAsync(faceId, faceId);
        await matcher.CompareFacesAsync(faceId, faceId);
    }
}
