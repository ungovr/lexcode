// lexcode-expect: 12
// The rest of each library's matching calls: FaceRecognitionDotNet's single comparison and distance,
// OpenCvSharp's Eigenfaces and Fisherfaces recognizers, Emgu CV's three recognizers built and
// target-typed (aliased), a SourceAFIS matcher and a Neurotechnology client target-typed, and
// DigitalPersona extraction from a raw image and one-to-many identification.
using DPUruNet;
using FaceRecognitionDotNet;
using Neurotec.Biometrics.Client;
using OpenCvSharp.Face;
using SourceAFIS;
using Ecv = Emgu.CV.Face;

namespace Contoso.Kiosk;

public sealed class EnrollmentDesk
{
    public double Compare(FaceEncoding known, FaceEncoding probe)
    {
        var same = FaceRecognition.CompareFace(known, probe, 0.6);
        return FaceRecognition.FaceDistance(known, probe);
    }

    public void Train(OpenCvSharp.Mat[] images, int[] labels)
    {
        using var eigen = EigenFaceRecognizer.Create();
        using var fisher = FisherFaceRecognizer.Create();
        Ecv.LBPHFaceRecognizer lbph = new(1, 8, 8, 8, 100);
        var emguEigen = new Ecv.EigenFaceRecognizer(80, double.PositiveInfinity);
        var emguFisher = new Ecv.FisherFaceRecognizer(0, 3500);
        Ecv.FisherFaceRecognizer typedFisher = new(0, 3500);
    }

    public double Match(FingerprintTemplate probe, FingerprintTemplate candidate)
    {
        FingerprintMatcher matcher = new(probe);
        return matcher.Match(candidate);
    }

    public void Reader(byte[] raw, Fmd probe, Fmd[] gallery)
    {
        var extracted = FeatureExtraction.CreateFmdFromRaw(raw, 0, 0, 500, 550, 700, Constants.Formats.Fmd.ANSI);
        var candidates = Comparison.Identify(probe, 0, gallery, 21474, 5);
    }

    public NBiometricClient Neurotec()
    {
        NBiometricClient client = new() { BiometricTypes = Neurotec.Biometrics.NBiometricType.Finger };
        return client;
    }
}
