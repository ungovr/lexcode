// lexcode-expect: 5
// The conversation a client sends in a request goes to the model: minimal API endpoints with the client as a handler
// parameter (plain, [FromServices] and under an alias), a controller with the client injected through its constructor,
// and the OpenAI SDK's ChatClient injected through a primary constructor.
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.AI;
using OpenAI.Chat;
using Ai = Microsoft.Extensions.AI;

namespace App.Chat;

public static class ChatEndpoints
{
    public static void Map(WebApplication app)
    {
        app.MapPost("/chat", async (ChatRequest request, IChatClient client) =>
            (await client.GetResponseAsync(request.Messages)).Text);

        app.MapPost("/chat/stream", ([FromBody] ChatRequest body, [FromServices] IChatClient chat) =>
            chat.GetStreamingResponseAsync(body.Messages.Select(m => new Microsoft.Extensions.AI.ChatMessage(new ChatRole(m.Role), m.Content))));

        app.MapPost("/chat/alias", async (ChatRequest request, Ai.IChatClient assistant) =>
            await assistant.GetResponseAsync(request.History, new Ai.ChatOptions { Temperature = 0.2f }));
    }
}

[ApiController]
[Route("api/[controller]")]
public class ConversationController : ControllerBase
{
    private readonly IChatClient _chat;

    public ConversationController(IChatClient chat) => _chat = chat;

    [HttpPost]
    public async Task<IActionResult> Post([FromBody] ChatRequest request) =>
        Ok((await _chat.GetResponseAsync(request.Messages)).Text);
}

public class OpenAiChat(ChatClient client)
{
    public async Task<string> ReplyAsync(ConversationDto dto)
    {
        ChatCompletion completion = await client.CompleteChatAsync(dto.Messages.Select(m => (OpenAI.Chat.ChatMessage)new UserChatMessage(m.Content)));
        return completion.Content[0].Text;
    }
}
