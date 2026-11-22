// lexcode-expect: 8
// A Gemini model called with HttpClient at an address built by interpolation, concatenation or
// string.Format, its reply sent back from a controller action (#13205 B1): a local interpolated
// with the model and the key and posted, a local joined with the model and the key in a request
// message, a local formatted and posted as JSON, Vertex AI's address with the region and the
// project in a local, an address joined at the call, a field, an expression-bodied property and an
// auto-property of the controller that hold one, each posted.
using System.Net.Http;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Generated;

public class BuiltGeminiController(HttpClient http) : ControllerBase
{
    private static string Model = "gemini-2.5-flash";
    private readonly string _flashUrl = $"https://generativelanguage.googleapis.com/v1beta/models/{Model}:generateContent";
    private static string ProUrl => "https://generativelanguage.googleapis.com/v1beta/models/" + Model + ":generateContent";
    public string KeyedUrl { get; } = string.Format("https://generativelanguage.googleapis.com/v1beta/models/{0}:generateContent", Model);

    public async Task<IActionResult> Interpolated(HttpContent body, string model, string key)
    {
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}";
        var r = await http.PostAsync(url, body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> Joined(HttpContent body, string model, string key)
    {
        string url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + key;
        var request = new HttpRequestMessage(HttpMethod.Post, url) { Content = body };
        var r = await http.SendAsync(request);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> Formatted(object body, string model, string key)
    {
        var url = string.Format("https://generativelanguage.googleapis.com/v1beta/models/{0}:generateContent?key={1}", model, key);
        var r = await http.PostAsJsonAsync(url, body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> Vertex(object body, string region, string project, string model)
    {
        var url = $"https://{region}-aiplatform.googleapis.com/v1/projects/{project}/locations/{region}/publishers/google/models/{model}:generateContent";
        var r = await http.PostAsJsonAsync(url, body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> AtTheCall(HttpContent body, string model)
    {
        var r = await http.PostAsync("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> Field(HttpContent body)
    {
        var r = await http.PostAsync(_flashUrl, body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> Property(HttpContent body)
    {
        var r = await http.PostAsync(ProUrl, body);
        return Ok(await r.Content.ReadAsStringAsync());
    }

    public async Task<IActionResult> AutoProperty(HttpContent body)
    {
        var r = await http.PostAsync(KeyedUrl, body);
        return Ok(await r.Content.ReadAsStringAsync());
    }
}
