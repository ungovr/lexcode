// lexcode-expect: 4
// Training a TorchSharp network on the app's data: the optimizer is built through `using static
// TorchSharp.torch` (as TorchSharp's examples write it), through the torch class, named in full, and
// through an alias, and each training loop back-propagates the loss and steps it.
using TorchSharp;
using TorchSharp.Modules;
using static TorchSharp.torch;
using static TorchSharp.torch.nn;
using Optim = TorchSharp.torch.optim;

namespace Contoso.Vision;

public sealed class DefectTrainer
{
    private readonly Module<Tensor, Tensor> _model = Sequential(Linear(512, 128), ReLU(), Linear(128, 4));

    public void Train(IEnumerable<(Tensor Input, Tensor Label)> batches, int epochs)
    {
        var optimizer = optim.Adam(_model.parameters(), lr: 1e-3);
        var loss = CrossEntropyLoss();
        _model.train();
        for (var epoch = 0; epoch < epochs; epoch++)
        {
            foreach (var (input, label) in batches)
            {
                optimizer.zero_grad();
                var output = loss.forward(_model.forward(input), label);
                output.backward();
                optimizer.step();
            }
        }
    }

    public void FineTune(IEnumerable<(Tensor Input, Tensor Label)> batches)
    {
        var sgd = torch.optim.SGD(_model.parameters(), 0.01);
        var adamw = TorchSharp.torch.optim.AdamW(_model.parameters());
        var rms = Optim.RMSProp(_model.parameters());
        foreach (var (input, label) in batches)
        {
            sgd.zero_grad();
            functional.mse_loss(_model.forward(input), label).backward();
            sgd.step();
        }
        adamw.step();
        rms.step();
    }
}
