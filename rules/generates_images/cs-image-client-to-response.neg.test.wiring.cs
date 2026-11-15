// lexcode-expect: 0
// A model client made by a factory and kept in a Blazor component's field, then copied to
// another field: wiring, nothing the component renders. Pins the component guard of the
// signal rule.
using OpenAI;
using Microsoft.AspNetCore.Components;

namespace Demo.Wiring;

public class Wiring : ComponentBase
{
    [Inject] public OpenAIClient OpenAi { get; set; } = default!;
    private object? _client;
    private object? _kept;

    protected override void OnInitialized()
    {
        _client = OpenAi.GetImageClient("dall-e-3");
        _kept = _client;
    }
}
