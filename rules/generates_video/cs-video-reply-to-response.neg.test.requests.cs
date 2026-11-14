// lexcode-expect: 0
// A request built for a generation model but never sent, echoed back as the response (the
// request, the model or address it names, the request serialized), and a request for a
// model or address of another kind, sent. Only the result of sending a request for a
// generation model is output (the REQUEST label). Generated with the rule's request sources
// (#13012 fix round 1).
using Amazon.BedrockRuntime.Model;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Generated;

public class RequestsController : ControllerBase
{
    // new StartAsyncInvokeRequest { ModelId = ... }, echoed
    public async Task<IActionResult> Case1(IRuntimeClient runtime, HttpClient http)
    {
        var request = new StartAsyncInvokeRequest { ContentType = "application/json", ModelId = "amazon.nova-reel-v1:1" };
        return Ok(request);
    }

    // new StartAsyncInvokeRequest { ModelId = ... }, its model id
    public async Task<IActionResult> Case2(IRuntimeClient runtime, HttpClient http)
    {
        var request = new StartAsyncInvokeRequest { ContentType = "application/json", ModelId = "amazon.nova-reel-v1:1" };
        return Ok(request.ModelId);
    }

    // new StartAsyncInvokeRequest { ModelId = ... }, serialized (not sent)
    public async Task<IActionResult> Case3(IRuntimeClient runtime, HttpClient http)
    {
        var request = new StartAsyncInvokeRequest { ContentType = "application/json", ModelId = "amazon.nova-reel-v1:1" };
        return Ok(System.Text.Json.JsonSerializer.Serialize(request));
    }

    // new StartAsyncInvokeRequest { ModelId = ... } for a model of another kind, sent
    public async Task<IActionResult> Case4(IRuntimeClient runtime, HttpClient http)
    {
        var request = new StartAsyncInvokeRequest { ContentType = "application/json", ModelId = "twelvelabs.marengo-embed-2-7-v1:0" };
        var response = await runtime.StartAsyncInvokeAsync(request);
        return Ok(response);
    }

    // new HttpRequestMessage for a video address, echoed
    public async Task<IActionResult> Case5(IRuntimeClient runtime, HttpClient http)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/videos");
        return Ok(request);
    }

    // new HttpRequestMessage for a video address, its address
    public async Task<IActionResult> Case6(IRuntimeClient runtime, HttpClient http)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/videos");
        return Ok(request.RequestUri);
    }

    // new HttpRequestMessage for an image address, sent
    public async Task<IActionResult> Case7(IRuntimeClient runtime, HttpClient http)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/images/generations");
        var response = await http.SendAsync(request);
        return Ok(response);
    }
}
