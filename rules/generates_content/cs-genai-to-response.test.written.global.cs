// lexcode-expect: 6
// The short-form request messages of the written-address fixture in a file with no
// `using System.Net.Http;` (the SDK imports it implicitly), so only the short-form patterns read
// them: constructed and target-typed, by position and named, each reply sent back from a
// controller action.
using Microsoft.AspNetCore.Mvc;

namespace Demo.Written;

public class GeminiWrittenGlobalController(HttpClient http) : ControllerBase
{
    public async Task<IActionResult> MessageVerbatim(HttpContent content, string model, string key, string trace)
    {
        var r = await http.SendAsync(new HttpRequestMessage(HttpMethod.Post, @$"https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent") { Content = content });
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> MessageNamedJoined(HttpContent content, string model, string key, string trace)
    {
        var r = await http.SendAsync(new HttpRequestMessage(requestUri: "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", method: HttpMethod.Post));
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> TargetTypedInterpolated(HttpContent content, string model, string key, string trace)
    {
        HttpRequestMessage m = new(HttpMethod.Post, $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}") { Content = content };
        var r = await http.SendAsync(m);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> TargetTypedQualifiedVerbatim(HttpContent content, string model, string key, string trace)
    {
        System.Net.Http.HttpRequestMessage m = new(HttpMethod.Post, @$"https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent");
        var r = await http.SendAsync(m);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> TargetTypedNamedVerbatimFirst(HttpContent content, string model, string key, string trace)
    {
        HttpRequestMessage m = new(requestUri: $@"https://{trace}-aiplatform.googleapis.com/v1/projects/p/locations/l/publishers/google/models/{model}:generateContent", method: HttpMethod.Post);
        var r = await http.SendAsync(m);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> TargetTypedNamedQualifiedJoined(HttpContent content, string model, string key, string trace)
    {
        System.Net.Http.HttpRequestMessage m = new(method: HttpMethod.Post, requestUri: "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent");
        var r = await http.SendAsync(m);
        return Ok(await r.Content.ReadAsStringAsync());
    }
}
