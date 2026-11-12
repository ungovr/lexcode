// lexcode-expect: 0
// ML.NET used without training a model: the consumption side of a Model Builder project loads a
// trained model and predicts, and a preprocessing step fits only data transforms (normalizing and
// featurizing), which builds no model.
using Microsoft.ML;
using Microsoft.ML.Data;

namespace Contoso.Recommendations;

public sealed class ProductRanker
{
    private readonly Microsoft.ML.MLContext _ml = new(seed: 1);

    public float Score(ProductInput input)
    {
        ITransformer model = _ml.Model.Load("model.zip", out _);
        var engine = _ml.Model.CreatePredictionEngine<ProductInput, ProductScore>(model);
        return engine.Predict(input).Score;
    }

    public IDataView Prepare(IDataView data)
    {
        var transforms = _ml.Transforms.NormalizeMinMax("Price")
            .Append(_ml.Transforms.Text.FeaturizeText("Features", "Description"));
        return transforms.Fit(data).Transform(data);
    }
}
