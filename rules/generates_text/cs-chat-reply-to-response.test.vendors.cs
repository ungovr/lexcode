// lexcode-expect: 6
// The other vendors' text calls, each sent back from a controller action: the OpenAI Responses
// API, Azure AI Inference, the community Anthropic.SDK, Bedrock InvokeModel with a text model,
// Ollama with a reply gathered in a StringBuilder, and Bedrock Converse.
using System.Text;
using Amazon.BedrockRuntime;
using Amazon.BedrockRuntime.Model;
using Anthropic.SDK;
using Azure;
using Azure.AI.Inference;
using Microsoft.AspNetCore.Mvc;
using OllamaSharp;
using OpenAI.Responses;

namespace Demo.Web;

public class VendorController(IAmazonBedrockRuntime bedrock) : ControllerBase
{
    [HttpPost("responses")]
    public async Task<IActionResult> Responses(string q)
    {
        OpenAIResponseClient responses = new("gpt-4.1", "key");
        var response = await responses.CreateResponseAsync(q);
        return Ok(response.Value.GetOutputText());
    }

    [HttpPost("foundry")]
    public async Task<IActionResult> Foundry(string q)
    {
        var client = new ChatCompletionsClient(new Uri("https://example.services.ai.azure.com/models"), new AzureKeyCredential("key"));
        var result = await client.CompleteAsync(new ChatCompletionsOptions { Model = "phi-4" });
        return Ok(result.Value.Content);
    }

    [HttpPost("claude")]
    public async Task<IActionResult> Claude(MessageParameters parameters)
    {
        var client = new AnthropicClient();
        var message = await client.Messages.GetClaudeMessageAsync(parameters);
        return Ok(message.Message.ToString());
    }

    [HttpPost("titan")]
    public async Task<IActionResult> Titan(string q)
    {
        var request = new InvokeModelRequest { ContentType = "application/json", ModelId = "amazon.titan-text-premier-v1:0", Body = new MemoryStream() };
        var response = await bedrock.InvokeModelAsync(request);
        return File(response.Body, "application/json");
    }

    [HttpPost("ollama")]
    public async Task<IActionResult> Ollama(string q)
    {
        var ollama = new OllamaApiClient(new Uri("http://localhost:11434"));
        var text = new StringBuilder();
        await foreach (var chunk in ollama.GenerateAsync(q))
        {
            text.Append(chunk?.Response);
        }
        return Ok(text.ToString());
    }

    [HttpPost("converse")]
    public async Task<IActionResult> Converse(ConverseRequest request)
    {
        var reply = await bedrock.ConverseAsync(request);
        return Ok(reply.Output.Message.Content[0].Text);
    }
}
