// lexcode-expect: 0
// A model client made by a factory and kept in a Blazor component's field, then copied to
// another field: wiring, nothing the component renders. Pins the component guard of the
// signal rule.
using Mscc.GenerativeAI;
using Microsoft.AspNetCore.Components;

namespace Demo.Wiring;

public class Wiring : ComponentBase
{
    [Inject] public GoogleAI GoogleAi { get; set; } = default!;
    private GenerativeModel? _client;
    private GenerativeModel? _kept;

    protected override void OnInitialized()
    {
        _client = GoogleAi.GenerativeModel("gemini-2.5-flash");
        _client = new GenerativeModel("key");
        _kept = _client;
    }
}
