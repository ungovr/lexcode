// lexcode-expect: 0
// A pricing engine's own MLContext ("multi-level context") in another namespace, whose catalogs are
// named like ML.NET's: it looks up price tiers and trains nothing.
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
        return table.Price + fallback.Price + forecast.Price;
    }
}
