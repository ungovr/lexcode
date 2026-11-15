// lexcode-expect: 0
// TorchSharp used for inference only: a classifier loads saved weights, switches to evaluation and
// runs a forward pass under no_grad. Nothing builds an optimizer or steps one.
using TorchSharp;
using static TorchSharp.torch;
using static TorchSharp.torch.nn;

namespace Contoso.Vision;

public sealed class DefectClassifier
{
    private readonly Module<Tensor, Tensor> _model = Sequential(Linear(512, 128), ReLU(), Linear(128, 4));

    public DefectClassifier(string weightsPath)
    {
        _model.load(weightsPath);
        _model.eval();
    }

    public long Classify(float[] features)
    {
        using var _ = torch.no_grad();
        var input = torch.tensor(features).unsqueeze(0);
        return _model.forward(input).argmax(1).item<long>();
    }
}
