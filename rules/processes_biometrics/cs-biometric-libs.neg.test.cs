// lexcode-expect: 0
// Faces found in a photo without recognizing anyone (OpenCvSharp and Emgu CV cascade detection), a
// profile photo resized and stored, and look-alikes: the app's own FaceRecognition and
// FingerprintTemplate classes in another namespace with methods named like the libraries'.
using Contoso.Kiosk;
using OpenCvSharp;
using Ecv = Emgu.CV;

namespace Contoso.Photos;

public sealed class PhotoCleanup
{
    public Rect[] Faces(Mat image)
    {
        using var cascade = new CascadeClassifier("haarcascade_frontalface_default.xml");
        return cascade.DetectMultiScale(image, 1.1, 4);
    }

    public void EmguFaces(Ecv.Mat image)
    {
        using var cascade = new Ecv.CascadeClassifier("haarcascade_frontalface_default.xml");
        var found = cascade.DetectMultiScale(image);
    }

    public void Store(Mat photo, string path)
    {
        using var small = photo.Resize(new Size(256, 256));
        small.SaveImage(path);
    }

    public bool Local(byte[] scan, byte[] enrolled)
    {
        var template = new FingerprintTemplate(scan);
        var matches = FaceRecognition.CompareFaces(scan, enrolled);
        return matches && template.IsValid;
    }
}
