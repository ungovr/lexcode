// lexcode-expect: 0
// A pricing engine's own MLContext ("multi-level context") in another namespace, whose catalogs are
// named like ML.NET's: it looks up price tiers, and runs a pricing experiment (an A/B test), and
// trains nothing.
using Contoso.Pricing.Rules;

namespace Contoso.Checkout;

public sealed class Quoter(MLContext rules)
{
    private readonly MLContext _fallback = new();

    public decimal Quote(string tier)
    {
        var table = rules.Regression.Trainers.Lookup(tier);
        var fallback = _fallback.Recommendation().Trainers.Lookup(tier);
        var forecast = rules.Forecasting.ForecastBySsa(tier);
        var trial = rules.Auto().CreateExperiment();
        var split = _fallback.Auto().CreateRegressionExperiment(tier);
        return table.Price + fallback.Price + forecast.Price;
    }
}
