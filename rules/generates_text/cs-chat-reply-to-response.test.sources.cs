// lexcode-expect: 42
// Every source branch, its library imported with a using line.
// One action per source branch, each sending what the source produced back as the
// response.
using Amazon.BedrockRuntime.Model;
using Amazon.BedrockRuntime;
using Anthropic;
using Azure.AI.Inference;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.AI;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.TextGeneration;
using Microsoft.SemanticKernel;
using OllamaSharp;
using OpenAI.Chat;
using OpenAI.Responses;

namespace Demo.Generated;

public record Summary(string Body);

public class SourcesController : ControllerBase
{
    // (Microsoft.Extensions.AI.IChatClient $C).GetResponseAsync(...)
    public async Task<IActionResult> Case1(IChatClient client)
    {
        var r = await client.GetResponseAsync("q");
        return Ok(r);
    }

    // (Microsoft.Extensions.AI.IChatClient $C).GetResponseAsync<$T>(...)
    public async Task<IActionResult> Case2(IChatClient client)
    {
        var r = await client.GetResponseAsync<Summary>("q");
        return Ok(r);
    }

    // (Microsoft.Extensions.AI.IChatClient $C).GetStreamingResponseAsync(...)
    public async Task<IActionResult> Case3(IChatClient client)
    {
        var r = await client.GetStreamingResponseAsync("q");
        return Ok(r);
    }

    // (Microsoft.SemanticKernel.ChatCompletion.IChatCompletionService $C).GetChatMessageContentAsync(...)
    public async Task<IActionResult> Case4(IChatCompletionService client)
    {
        var r = await client.GetChatMessageContentAsync("q");
        return Ok(r);
    }

    // (Microsoft.SemanticKernel.ChatCompletion.IChatCompletionService $C).GetChatMessageContentsAsync(...)
    public async Task<IActionResult> Case5(IChatCompletionService client)
    {
        var r = await client.GetChatMessageContentsAsync("q");
        return Ok(r);
    }

    // (Microsoft.SemanticKernel.ChatCompletion.IChatCompletionService $C).GetStreamingChatMessageContentsAsync(...)
    public async Task<IActionResult> Case6(IChatCompletionService client)
    {
        var r = await client.GetStreamingChatMessageContentsAsync("q");
        return Ok(r);
    }

    // (Microsoft.SemanticKernel.TextGeneration.ITextGenerationService $C).GetTextContentAsync(...)
    public async Task<IActionResult> Case7(ITextGenerationService client)
    {
        var r = await client.GetTextContentAsync("q");
        return Ok(r);
    }

    // (Microsoft.SemanticKernel.TextGeneration.ITextGenerationService $C).GetTextContentsAsync(...)
    public async Task<IActionResult> Case8(ITextGenerationService client)
    {
        var r = await client.GetTextContentsAsync("q");
        return Ok(r);
    }

    // (Microsoft.SemanticKernel.TextGeneration.ITextGenerationService $C).GetStreamingTextContentsAsync(...)
    public async Task<IActionResult> Case9(ITextGenerationService client)
    {
        var r = await client.GetStreamingTextContentsAsync("q");
        return Ok(r);
    }

    // (Microsoft.SemanticKernel.Kernel $C).InvokePromptAsync(...)
    public async Task<IActionResult> Case10(Kernel client)
    {
        var r = await client.InvokePromptAsync("q");
        return Ok(r);
    }

    // (Microsoft.SemanticKernel.Kernel $C).InvokePromptStreamingAsync(...)
    public async Task<IActionResult> Case11(Kernel client)
    {
        var r = await client.InvokePromptStreamingAsync("q");
        return Ok(r);
    }

    // (OpenAI.Chat.ChatClient $C).CompleteChat(...)
    public async Task<IActionResult> Case12(ChatClient client)
    {
        var r = await client.CompleteChat("q");
        return Ok(r);
    }

    // (OpenAI.Chat.ChatClient $C).CompleteChatAsync(...)
    public async Task<IActionResult> Case13(ChatClient client)
    {
        var r = await client.CompleteChatAsync("q");
        return Ok(r);
    }

    // (OpenAI.Chat.ChatClient $C).CompleteChatStreaming(...)
    public async Task<IActionResult> Case14(ChatClient client)
    {
        var r = await client.CompleteChatStreaming("q");
        return Ok(r);
    }

    // (OpenAI.Chat.ChatClient $C).CompleteChatStreamingAsync(...)
    public async Task<IActionResult> Case15(ChatClient client)
    {
        var r = await client.CompleteChatStreamingAsync("q");
        return Ok(r);
    }

    // (OpenAI.Responses.OpenAIResponseClient $C).CreateResponse(...)
    public async Task<IActionResult> Case16(OpenAIResponseClient client)
    {
        var r = await client.CreateResponse("q");
        return Ok(r);
    }

    // (OpenAI.Responses.OpenAIResponseClient $C).CreateResponseAsync(...)
    public async Task<IActionResult> Case17(OpenAIResponseClient client)
    {
        var r = await client.CreateResponseAsync("q");
        return Ok(r);
    }

    // (OpenAI.Responses.OpenAIResponseClient $C).CreateResponseStreaming(...)
    public async Task<IActionResult> Case18(OpenAIResponseClient client)
    {
        var r = await client.CreateResponseStreaming("q");
        return Ok(r);
    }

    // (OpenAI.Responses.OpenAIResponseClient $C).CreateResponseStreamingAsync(...)
    public async Task<IActionResult> Case19(OpenAIResponseClient client)
    {
        var r = await client.CreateResponseStreamingAsync("q");
        return Ok(r);
    }

    // (Azure.AI.Inference.ChatCompletionsClient $C).Complete(...)
    public async Task<IActionResult> Case20(ChatCompletionsClient client)
    {
        var r = await client.Complete("q");
        return Ok(r);
    }

    // (Azure.AI.Inference.ChatCompletionsClient $C).CompleteAsync(...)
    public async Task<IActionResult> Case21(ChatCompletionsClient client)
    {
        var r = await client.CompleteAsync("q");
        return Ok(r);
    }

    // (Azure.AI.Inference.ChatCompletionsClient $C).CompleteStreamingAsync(...)
    public async Task<IActionResult> Case22(ChatCompletionsClient client)
    {
        var r = await client.CompleteStreamingAsync("q");
        return Ok(r);
    }

    // (Anthropic.AnthropicClient $C).Messages.Create(...)
    public async Task<IActionResult> Case23(AnthropicClient client)
    {
        var r = await client.Messages.Create("q");
        return Ok(r);
    }

    // (Anthropic.AnthropicClient $C).Messages.CreateStreaming(...)
    public async Task<IActionResult> Case24(AnthropicClient client)
    {
        var r = await client.Messages.CreateStreaming("q");
        return Ok(r);
    }

    // (Anthropic.IAnthropicClient $C).Messages.Create(...)
    public async Task<IActionResult> Case25(IAnthropicClient client)
    {
        var r = await client.Messages.Create("q");
        return Ok(r);
    }

    // (Anthropic.IAnthropicClient $C).Messages.CreateStreaming(...)
    public async Task<IActionResult> Case26(IAnthropicClient client)
    {
        var r = await client.Messages.CreateStreaming("q");
        return Ok(r);
    }

    // $V.Messages.GetClaudeMessageAsync(...)
    public async Task<IActionResult> Case27(IVendorClient vendor)
    {
        var r = await vendor.Messages.GetClaudeMessageAsync("q");
        return Ok(r);
    }

    // $V.Messages.StreamClaudeMessageAsync(...)
    public async Task<IActionResult> Case28(IVendorClient vendor)
    {
        var r = await vendor.Messages.StreamClaudeMessageAsync("q");
        return Ok(r);
    }

    // (Amazon.BedrockRuntime.IAmazonBedrockRuntime $C).ConverseAsync(...)
    public async Task<IActionResult> Case29(IAmazonBedrockRuntime client)
    {
        var r = await client.ConverseAsync("q");
        return Ok(r);
    }

    // (Amazon.BedrockRuntime.IAmazonBedrockRuntime $C).ConverseStreamAsync(...)
    public async Task<IActionResult> Case30(IAmazonBedrockRuntime client)
    {
        var r = await client.ConverseStreamAsync("q");
        return Ok(r);
    }

    // (Amazon.BedrockRuntime.AmazonBedrockRuntimeClient $C).ConverseAsync(...)
    public async Task<IActionResult> Case31(AmazonBedrockRuntimeClient client)
    {
        var r = await client.ConverseAsync("q");
        return Ok(r);
    }

    // (Amazon.BedrockRuntime.AmazonBedrockRuntimeClient $C).ConverseStreamAsync(...)
    public async Task<IActionResult> Case32(AmazonBedrockRuntimeClient client)
    {
        var r = await client.ConverseStreamAsync("q");
        return Ok(r);
    }

    // new Amazon.BedrockRuntime.Model.InvokeModelRequest { ModelId = ... }
    public async Task<IActionResult> Case33(IRuntimeClient runtime)
    {
        var request = new InvokeModelRequest { ContentType = "application/json", ModelId = "anthropic.claude-3-haiku-20240307-v1:0" };
        var r = await runtime.InvokeModelAsync(request);
        return Ok(r);
    }

    // Amazon.BedrockRuntime.Model.InvokeModelRequest declared with target-typed new()
    public async Task<IActionResult> Case34(IRuntimeClient runtime)
    {
        InvokeModelRequest request = new() { ContentType = "application/json", ModelId = "anthropic.claude-3-haiku-20240307-v1:0" };
        var r = await runtime.InvokeModelAsync(request);
        return Ok(r);
    }

    // new Amazon.BedrockRuntime.Model.InvokeModelWithResponseStreamRequest { ModelId = ... }
    public async Task<IActionResult> Case35(IRuntimeClient runtime)
    {
        var request = new InvokeModelWithResponseStreamRequest { ContentType = "application/json", ModelId = "meta.llama3-70b-instruct-v1:0" };
        var r = await runtime.InvokeModelWithResponseStreamAsync(request);
        return Ok(r);
    }

    // Amazon.BedrockRuntime.Model.InvokeModelWithResponseStreamRequest declared with target-typed new()
    public async Task<IActionResult> Case36(IRuntimeClient runtime)
    {
        InvokeModelWithResponseStreamRequest request = new() { ContentType = "application/json", ModelId = "meta.llama3-70b-instruct-v1:0" };
        var r = await runtime.InvokeModelWithResponseStreamAsync(request);
        return Ok(r);
    }

    // (OllamaSharp.IOllamaApiClient $C).GenerateAsync(...)
    public async Task<IActionResult> Case37(IOllamaApiClient client)
    {
        var r = await client.GenerateAsync("q");
        return Ok(r);
    }

    // (OllamaSharp.IOllamaApiClient $C).ChatAsync(...)
    public async Task<IActionResult> Case38(IOllamaApiClient client)
    {
        var r = await client.ChatAsync("q");
        return Ok(r);
    }

    // (OllamaSharp.OllamaApiClient $C).GenerateAsync(...)
    public async Task<IActionResult> Case39(OllamaApiClient client)
    {
        var r = await client.GenerateAsync("q");
        return Ok(r);
    }

    // (OllamaSharp.OllamaApiClient $C).ChatAsync(...)
    public async Task<IActionResult> Case40(OllamaApiClient client)
    {
        var r = await client.ChatAsync("q");
        return Ok(r);
    }

    // (OllamaSharp.Chat $C).SendAsync(...)
    public async Task<IActionResult> Case41(Chat client)
    {
        var r = await client.SendAsync("q");
        return Ok(r);
    }

    // (OllamaSharp.Chat $C).SendAsAsync(...)
    public async Task<IActionResult> Case42(Chat client)
    {
        var r = await client.SendAsAsync("q");
        return Ok(r);
    }
}
