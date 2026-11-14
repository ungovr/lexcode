// lexcode-expect: 5
// Semantic Kernel: the reply is added back to the ChatHistory the next turn is sent with, on a local history, a
// target-typed one, an injected one (a constructor parameter kept in a field), and one named under an alias.
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Sk = Microsoft.SemanticKernel.ChatCompletion;

namespace App.Assistant;

public class Conversation
{
    private readonly IChatCompletionService _completions;
    private readonly ChatHistory _history;

    public Conversation(IChatCompletionService completions, ChatHistory history)
    {
        _completions = completions;
        _history = history;
    }

    public async Task<string> ConsoleAsync()
    {
        var history = new ChatHistory("You are a helpful assistant.");
        while (Console.ReadLine() is { } line)
        {
            history.AddUserMessage(line);
            var reply = await _completions.GetChatMessageContentAsync(history);
            history.AddAssistantMessage(reply.Content ?? string.Empty);
        }
        return "";
    }

    public async Task TargetTypedAsync(string question)
    {
        ChatHistory chat = new();
        chat.AddUserMessage(question);
        var result = await _completions.GetChatMessageContentAsync(chat);
        chat.AddMessage(result.Role, result.Content ?? string.Empty);
    }

    public async Task InjectedAsync(string question)
    {
        _history.AddUserMessage(question);
        var result = await _completions.GetChatMessageContentAsync(_history);
        _history.Add(result);
    }

    public async Task AliasAsync(string question)
    {
        Sk.ChatHistory turns = new();
        turns.AddUserMessage(question);
        var response = await _completions.GetChatMessageContentAsync(turns);
        turns.AddMessage(AuthorRole.Assistant, response.Content!);
    }

    public async Task StreamAsync(string question)
    {
        var history = new ChatHistory();
        history.AddUserMessage(question);
        var text = new System.Text.StringBuilder();
        await foreach (var chunk in _completions.GetStreamingChatMessageContentsAsync(history))
        {
            text.Append(chunk.Content);
        }
        history.AddAssistantMessage(text.ToString());
    }
}
