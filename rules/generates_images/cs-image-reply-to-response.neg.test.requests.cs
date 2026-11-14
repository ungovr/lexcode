// lexcode-expect: 0
// A request built for a generation model but never sent, echoed back as the response (the
// request, the model or address it names, the request serialized), and a request for a
// model or address of another kind, sent. Only the result of sending a request for a
// generation model is output (the REQUEST label).
using Amazon.BedrockRuntime.Model;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Generated;

public class RequestsController : ControllerBase
{
    // new InvokeModelRequest { ModelId = ... }, echoed
    public async Task<IActionResult> Case1(IRuntimeClient runtime, HttpClient http)
    {
        var request = new InvokeModelRequest { ContentType = "application/json", ModelId = "amazon.nova-canvas-v1:0" };
        return Ok(request);
    }

    // new InvokeModelRequest { ModelId = ... }, its model id
    public async Task<IActionResult> Case2(IRuntimeClient runtime, HttpClient http)
    {
        var request = new InvokeModelRequest { ContentType = "application/json", ModelId = "amazon.nova-canvas-v1:0" };
        return Ok(request.ModelId);
    }

    // InvokeModelRequest declared with target-typed new(), echoed
    public async Task<IActionResult> Case3(IRuntimeClient runtime, HttpClient http)
    {
        InvokeModelRequest request = new() { ContentType = "application/json", ModelId = "amazon.nova-canvas-v1:0" };
        return Ok(request);
    }

    // new InvokeModelRequest { ModelId = ... }, serialized (not sent)
    public async Task<IActionResult> Case4(IRuntimeClient runtime, HttpClient http)
    {
        var request = new InvokeModelRequest { ContentType = "application/json", ModelId = "amazon.nova-canvas-v1:0" };
        return Ok(System.Text.Json.JsonSerializer.Serialize(request));
    }

    // new InvokeModelRequest { ModelId = ... } for a model of another kind, sent
    public async Task<IActionResult> Case5(IRuntimeClient runtime, HttpClient http)
    {
        var request = new InvokeModelRequest { ContentType = "application/json", ModelId = "amazon.titan-embed-image-v1" };
        var response = await runtime.InvokeModelAsync(request);
        return Ok(response);
    }
}
