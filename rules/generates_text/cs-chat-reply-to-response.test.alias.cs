// lexcode-expect: 40
// Every source branch whose library type can be aliased, reached through the alias.
// One action per source branch, each sending what the source produced back as the
// response.
using AA8 = Anthropic;
using AAAI7 = Azure.AI.Inference;
using AAB9 = Amazon.BedrockRuntime;
using AABM10 = Amazon.BedrockRuntime.Model;
using AMEA1 = Microsoft.Extensions.AI;
using AMS4 = Microsoft.SemanticKernel;
using AMSC2 = Microsoft.SemanticKernel.ChatCompletion;
using AMST3 = Microsoft.SemanticKernel.TextGeneration;
using AO11 = OllamaSharp;
using AOC5 = OpenAI.Chat;
using AOR6 = OpenAI.Responses;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Generated;

public record Summary(string Body);

public class SourcesController : ControllerBase
{
    // (Microsoft.Extensions.AI.IChatClient $C).GetResponseAsync(...)
    public async Task<IActionResult> Case1(AMEA1.IChatClient client)
    {
        var r = await client.GetResponseAsync("q");
        return Ok(r);
    }

    // (Microsoft.Extensions.AI.IChatClient $C).GetResponseAsync<$T>(...)
    public async Task<IActionResult> Case2(AMEA1.IChatClient client)
    {
        var r = await client.GetResponseAsync<Summary>("q");
        return Ok(r);
    }

    // (Microsoft.Extensions.AI.IChatClient $C).GetStreamingResponseAsync(...)
    public async Task<IActionResult> Case3(AMEA1.IChatClient client)
    {
        var r = await client.GetStreamingResponseAsync("q");
        return Ok(r);
    }

    // (Microsoft.SemanticKernel.ChatCompletion.IChatCompletionService $C).GetChatMessageContentAsync(...)
    public async Task<IActionResult> Case4(AMSC2.IChatCompletionService client)
    {
        var r = await client.GetChatMessageContentAsync("q");
        return Ok(r);
    }

    // (Microsoft.SemanticKernel.ChatCompletion.IChatCompletionService $C).GetChatMessageContentsAsync(...)
    public async Task<IActionResult> Case5(AMSC2.IChatCompletionService client)
    {
        var r = await client.GetChatMessageContentsAsync("q");
        return Ok(r);
    }

    // (Microsoft.SemanticKernel.ChatCompletion.IChatCompletionService $C).GetStreamingChatMessageContentsAsync(...)
    public async Task<IActionResult> Case6(AMSC2.IChatCompletionService client)
    {
        var r = await client.GetStreamingChatMessageContentsAsync("q");
        return Ok(r);
    }

    // (Microsoft.SemanticKernel.TextGeneration.ITextGenerationService $C).GetTextContentAsync(...)
    public async Task<IActionResult> Case7(AMST3.ITextGenerationService client)
    {
        var r = await client.GetTextContentAsync("q");
        return Ok(r);
    }

    // (Microsoft.SemanticKernel.TextGeneration.ITextGenerationService $C).GetTextContentsAsync(...)
    public async Task<IActionResult> Case8(AMST3.ITextGenerationService client)
    {
        var r = await client.GetTextContentsAsync("q");
        return Ok(r);
    }

    // (Microsoft.SemanticKernel.TextGeneration.ITextGenerationService $C).GetStreamingTextContentsAsync(...)
    public async Task<IActionResult> Case9(AMST3.ITextGenerationService client)
    {
        var r = await client.GetStreamingTextContentsAsync("q");
        return Ok(r);
    }

    // (Microsoft.SemanticKernel.Kernel $C).InvokePromptAsync(...)
    public async Task<IActionResult> Case10(AMS4.Kernel client)
    {
        var r = await client.InvokePromptAsync("q");
        return Ok(r);
    }

    // (Microsoft.SemanticKernel.Kernel $C).InvokePromptStreamingAsync(...)
    public async Task<IActionResult> Case11(AMS4.Kernel client)
    {
        var r = await client.InvokePromptStreamingAsync("q");
        return Ok(r);
    }

    // (OpenAI.Chat.ChatClient $C).CompleteChat(...)
    public async Task<IActionResult> Case12(AOC5.ChatClient client)
    {
        var r = await client.CompleteChat("q");
        return Ok(r);
    }

    // (OpenAI.Chat.ChatClient $C).CompleteChatAsync(...)
    public async Task<IActionResult> Case13(AOC5.ChatClient client)
    {
        var r = await client.CompleteChatAsync("q");
        return Ok(r);
    }

    // (OpenAI.Chat.ChatClient $C).CompleteChatStreaming(...)
    public async Task<IActionResult> Case14(AOC5.ChatClient client)
    {
        var r = await client.CompleteChatStreaming("q");
        return Ok(r);
    }

    // (OpenAI.Chat.ChatClient $C).CompleteChatStreamingAsync(...)
    public async Task<IActionResult> Case15(AOC5.ChatClient client)
    {
        var r = await client.CompleteChatStreamingAsync("q");
        return Ok(r);
    }

    // (OpenAI.Responses.OpenAIResponseClient $C).CreateResponse(...)
    public async Task<IActionResult> Case16(AOR6.OpenAIResponseClient client)
    {
        var r = await client.CreateResponse("q");
        return Ok(r);
    }

    // (OpenAI.Responses.OpenAIResponseClient $C).CreateResponseAsync(...)
    public async Task<IActionResult> Case17(AOR6.OpenAIResponseClient client)
    {
        var r = await client.CreateResponseAsync("q");
        return Ok(r);
    }

    // (OpenAI.Responses.OpenAIResponseClient $C).CreateResponseStreaming(...)
    public async Task<IActionResult> Case18(AOR6.OpenAIResponseClient client)
    {
        var r = await client.CreateResponseStreaming("q");
        return Ok(r);
    }

    // (OpenAI.Responses.OpenAIResponseClient $C).CreateResponseStreamingAsync(...)
    public async Task<IActionResult> Case19(AOR6.OpenAIResponseClient client)
    {
        var r = await client.CreateResponseStreamingAsync("q");
        return Ok(r);
    }

    // (Azure.AI.Inference.ChatCompletionsClient $C).Complete(...)
    public async Task<IActionResult> Case20(AAAI7.ChatCompletionsClient client)
    {
        var r = await client.Complete("q");
        return Ok(r);
    }

    // (Azure.AI.Inference.ChatCompletionsClient $C).CompleteAsync(...)
    public async Task<IActionResult> Case21(AAAI7.ChatCompletionsClient client)
    {
        var r = await client.CompleteAsync("q");
        return Ok(r);
    }

    // (Azure.AI.Inference.ChatCompletionsClient $C).CompleteStreamingAsync(...)
    public async Task<IActionResult> Case22(AAAI7.ChatCompletionsClient client)
    {
        var r = await client.CompleteStreamingAsync("q");
        return Ok(r);
    }

    // (Anthropic.AnthropicClient $C).Messages.Create(...)
    public async Task<IActionResult> Case23(AA8.AnthropicClient client)
    {
        var r = await client.Messages.Create("q");
        return Ok(r);
    }

    // (Anthropic.AnthropicClient $C).Messages.CreateStreaming(...)
    public async Task<IActionResult> Case24(AA8.AnthropicClient client)
    {
        var r = await client.Messages.CreateStreaming("q");
        return Ok(r);
    }

    // (Anthropic.IAnthropicClient $C).Messages.Create(...)
    public async Task<IActionResult> Case25(AA8.IAnthropicClient client)
    {
        var r = await client.Messages.Create("q");
        return Ok(r);
    }

    // (Anthropic.IAnthropicClient $C).Messages.CreateStreaming(...)
    public async Task<IActionResult> Case26(AA8.IAnthropicClient client)
    {
        var r = await client.Messages.CreateStreaming("q");
        return Ok(r);
    }

    // (Amazon.BedrockRuntime.IAmazonBedrockRuntime $C).ConverseAsync(...)
    public async Task<IActionResult> Case27(AAB9.IAmazonBedrockRuntime client)
    {
        var r = await client.ConverseAsync("q");
        return Ok(r);
    }

    // (Amazon.BedrockRuntime.IAmazonBedrockRuntime $C).ConverseStreamAsync(...)
    public async Task<IActionResult> Case28(AAB9.IAmazonBedrockRuntime client)
    {
        var r = await client.ConverseStreamAsync("q");
        return Ok(r);
    }

    // (Amazon.BedrockRuntime.AmazonBedrockRuntimeClient $C).ConverseAsync(...)
    public async Task<IActionResult> Case29(AAB9.AmazonBedrockRuntimeClient client)
    {
        var r = await client.ConverseAsync("q");
        return Ok(r);
    }

    // (Amazon.BedrockRuntime.AmazonBedrockRuntimeClient $C).ConverseStreamAsync(...)
    public async Task<IActionResult> Case30(AAB9.AmazonBedrockRuntimeClient client)
    {
        var r = await client.ConverseStreamAsync("q");
        return Ok(r);
    }

    // new Amazon.BedrockRuntime.Model.InvokeModelRequest { ModelId = ... }
    public async Task<IActionResult> Case31(IRuntimeClient runtime)
    {
        var request = new AABM10.InvokeModelRequest { ContentType = "application/json", ModelId = "anthropic.claude-3-haiku-20240307-v1:0" };
        var r = await runtime.InvokeModelAsync(request);
        return Ok(r);
    }

    // Amazon.BedrockRuntime.Model.InvokeModelRequest declared with target-typed new()
    public async Task<IActionResult> Case32(IRuntimeClient runtime)
    {
        AABM10.InvokeModelRequest request = new() { ContentType = "application/json", ModelId = "anthropic.claude-3-haiku-20240307-v1:0" };
        var r = await runtime.InvokeModelAsync(request);
        return Ok(r);
    }

    // new Amazon.BedrockRuntime.Model.InvokeModelWithResponseStreamRequest { ModelId = ... }
    public async Task<IActionResult> Case33(IRuntimeClient runtime)
    {
        var request = new AABM10.InvokeModelWithResponseStreamRequest { ContentType = "application/json", ModelId = "meta.llama3-70b-instruct-v1:0" };
        var r = await runtime.InvokeModelWithResponseStreamAsync(request);
        return Ok(r);
    }

    // Amazon.BedrockRuntime.Model.InvokeModelWithResponseStreamRequest declared with target-typed new()
    public async Task<IActionResult> Case34(IRuntimeClient runtime)
    {
        AABM10.InvokeModelWithResponseStreamRequest request = new() { ContentType = "application/json", ModelId = "meta.llama3-70b-instruct-v1:0" };
        var r = await runtime.InvokeModelWithResponseStreamAsync(request);
        return Ok(r);
    }

    // (OllamaSharp.IOllamaApiClient $C).GenerateAsync(...)
    public async Task<IActionResult> Case35(AO11.IOllamaApiClient client)
    {
        var r = await client.GenerateAsync("q");
        return Ok(r);
    }

    // (OllamaSharp.IOllamaApiClient $C).ChatAsync(...)
    public async Task<IActionResult> Case36(AO11.IOllamaApiClient client)
    {
        var r = await client.ChatAsync("q");
        return Ok(r);
    }

    // (OllamaSharp.OllamaApiClient $C).GenerateAsync(...)
    public async Task<IActionResult> Case37(AO11.OllamaApiClient client)
    {
        var r = await client.GenerateAsync("q");
        return Ok(r);
    }

    // (OllamaSharp.OllamaApiClient $C).ChatAsync(...)
    public async Task<IActionResult> Case38(AO11.OllamaApiClient client)
    {
        var r = await client.ChatAsync("q");
        return Ok(r);
    }

    // (OllamaSharp.Chat $C).SendAsync(...)
    public async Task<IActionResult> Case39(AO11.Chat client)
    {
        var r = await client.SendAsync("q");
        return Ok(r);
    }

    // (OllamaSharp.Chat $C).SendAsAsync(...)
    public async Task<IActionResult> Case40(AO11.Chat client)
    {
        var r = await client.SendAsAsync("q");
        return Ok(r);
    }
}
