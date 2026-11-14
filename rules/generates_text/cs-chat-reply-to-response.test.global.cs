// lexcode-expect: 12
// No using at all: only the vendor-named short forms can match, as in a file whose
// usings are global ones in another file.
// One action per source branch, each sending what the source produced back as the
// response.
using Microsoft.AspNetCore.Mvc;

namespace Demo.Generated;

public record Summary(string Body);

public class SourcesController : ControllerBase
{
    // (Anthropic.AnthropicClient $C).Messages.Create(...)
    public async Task<IActionResult> Case1(AnthropicClient client)
    {
        var r = await client.Messages.Create("q");
        return Ok(r);
    }

    // (Anthropic.AnthropicClient $C).Messages.CreateStreaming(...)
    public async Task<IActionResult> Case2(AnthropicClient client)
    {
        var r = await client.Messages.CreateStreaming("q");
        return Ok(r);
    }

    // (Anthropic.IAnthropicClient $C).Messages.Create(...)
    public async Task<IActionResult> Case3(IAnthropicClient client)
    {
        var r = await client.Messages.Create("q");
        return Ok(r);
    }

    // (Anthropic.IAnthropicClient $C).Messages.CreateStreaming(...)
    public async Task<IActionResult> Case4(IAnthropicClient client)
    {
        var r = await client.Messages.CreateStreaming("q");
        return Ok(r);
    }

    // (Amazon.BedrockRuntime.IAmazonBedrockRuntime $C).ConverseAsync(...)
    public async Task<IActionResult> Case5(IAmazonBedrockRuntime client)
    {
        var r = await client.ConverseAsync("q");
        return Ok(r);
    }

    // (Amazon.BedrockRuntime.IAmazonBedrockRuntime $C).ConverseStreamAsync(...)
    public async Task<IActionResult> Case6(IAmazonBedrockRuntime client)
    {
        var r = await client.ConverseStreamAsync("q");
        return Ok(r);
    }

    // (Amazon.BedrockRuntime.AmazonBedrockRuntimeClient $C).ConverseAsync(...)
    public async Task<IActionResult> Case7(AmazonBedrockRuntimeClient client)
    {
        var r = await client.ConverseAsync("q");
        return Ok(r);
    }

    // (Amazon.BedrockRuntime.AmazonBedrockRuntimeClient $C).ConverseStreamAsync(...)
    public async Task<IActionResult> Case8(AmazonBedrockRuntimeClient client)
    {
        var r = await client.ConverseStreamAsync("q");
        return Ok(r);
    }

    // (OllamaSharp.IOllamaApiClient $C).GenerateAsync(...)
    public async Task<IActionResult> Case9(IOllamaApiClient client)
    {
        var r = await client.GenerateAsync("q");
        return Ok(r);
    }

    // (OllamaSharp.IOllamaApiClient $C).ChatAsync(...)
    public async Task<IActionResult> Case10(IOllamaApiClient client)
    {
        var r = await client.ChatAsync("q");
        return Ok(r);
    }

    // (OllamaSharp.OllamaApiClient $C).GenerateAsync(...)
    public async Task<IActionResult> Case11(OllamaApiClient client)
    {
        var r = await client.GenerateAsync("q");
        return Ok(r);
    }

    // (OllamaSharp.OllamaApiClient $C).ChatAsync(...)
    public async Task<IActionResult> Case12(OllamaApiClient client)
    {
        var r = await client.ChatAsync("q");
        return Ok(r);
    }
}
