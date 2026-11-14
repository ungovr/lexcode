// lexcode-expect: 0
// A query planner's own `torch` helper in another namespace (it lights up slow queries) with an
// `optim` class whose methods share PyTorch's optimizer names. It trains nothing.
using Contoso.Sql.Planning;
using static Contoso.Sql.Planning.torch;

namespace Contoso.Sql;

public sealed class PlanTuner
{
    public Plan Tune(Query query)
    {
        var first = optim.Adam(query);
        var second = torch.optim.SGD(query, 0.01);
        return first.Cheaper(second);
    }
}
