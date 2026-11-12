// lexcode-expect: 11
// Matching faces and fingerprints with biometric libraries: FaceRecognitionDotNet (imported, with a
// typed field), OpenCvSharp's and Emgu CV's face recognizers (Emgu aliased, and target-typed),
// SourceAFIS templates and matching, DigitalPersona feature extraction and comparison, and a
// Neurotechnology biometric client.
using DPUruNet;
using FaceRecognitionDotNet;
using Neurotec.Biometrics.Client;
using OpenCvSharp.Face;
using SourceAFIS;
using EmguFace = Emgu.CV.Face;

namespace Contoso.Kiosk;

public sealed class BadgeCheck
{
    private readonly FaceRecognition _faces = FaceRecognition.Create("models");

    public bool Face(Image probe, FaceEncoding[] enrolled)
    {
        var encodings = _faces.FaceEncodings(probe).ToArray();
        var matches = FaceRecognition.CompareFaces(enrolled, encodings[0], 0.6);
        return matches.Any(m => m);
    }

    public void Train(OpenCvSharp.Mat[] images, int[] labels)
    {
        using var lbph = LBPHFaceRecognizer.Create();
        lbph.Train(images, labels);
        var emgu = new EmguFace.LBPHFaceRecognizer(1, 8, 8, 8, 100);
        EmguFace.EigenFaceRecognizer eigen = new(80, double.PositiveInfinity);
    }

    public double Fingerprint(byte[] probeImage, byte[] candidateImage)
    {
        var probe = new FingerprintTemplate(new FingerprintImage(probeImage));
        FingerprintTemplate candidate = new(new FingerprintImage(candidateImage));
        return new FingerprintMatcher(probe).Match(candidate);
    }

    public void Reader(Fid captured, Fmd enrolled)
    {
        var extracted = FeatureExtraction.CreateFmdFromFid(captured, Constants.Formats.Fmd.ANSI);
        var result = Comparison.Compare(extracted.Data, 0, enrolled, 0);
    }

    public NBiometricClient Neurotec() => new NBiometricClient { BiometricTypes = Neurotec.Biometrics.NBiometricType.Face };
}
