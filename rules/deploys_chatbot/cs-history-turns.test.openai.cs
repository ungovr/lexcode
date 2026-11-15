// lexcode-expect: 5
// The OpenAI .NET SDK and Azure.AI.OpenAI: an assistant turn built from the completion is added back to the
// conversation, under the import, under an alias, target-typed, through the factory method, and with the 1.x Azure
// SDK's request message.
using OpenAI.Chat;
using Oai = OpenAI.Chat;
using Azure.AI.OpenAI;

namespace App.Help;

public class HelpDesk(ChatClient client, OpenAIClient azure)
{
    private readonly List<ChatMessage> _messages = [new SystemChatMessage("You answer questions about our store.")];

    public async Task<string> AskAsync(string question)
    {
        _messages.Add(new UserChatMessage(question));
        ChatCompletion completion = await client.CompleteChatAsync(_messages);
        _messages.Add(new AssistantChatMessage(completion));
        return completion.Content[0].Text;
    }

    public async Task<string> AliasAsync(List<Oai.ChatMessage> messages, string question)
    {
        messages.Add(new Oai.UserChatMessage(question));
        Oai.ChatCompletion completion = await client.CompleteChatAsync(messages);
        messages.Add(new Oai.AssistantChatMessage(completion));
        return completion.Content[0].Text;
    }

    public async Task TargetTypedAsync(List<ChatMessage> messages, string question)
    {
        messages.Add(new UserChatMessage(question));
        ChatCompletion completion = await client.CompleteChatAsync(messages);
        AssistantChatMessage reply = new(completion);
        messages.Add(reply);
    }

    public async Task FactoryAsync(List<ChatMessage> messages, string question)
    {
        messages.Add(ChatMessage.CreateUserMessage(question));
        ChatCompletion completion = await client.CompleteChatAsync(messages);
        messages.Add(ChatMessage.CreateAssistantMessage(completion));
    }

    public async Task AzureV1Async(ChatCompletionsOptions options, string question)
    {
        options.Messages.Add(new ChatRequestUserMessage(question));
        var response = await azure.GetChatCompletionsAsync(options);
        options.Messages.Add(new ChatRequestAssistantMessage(response.Value.Choices[0].Message.Content));
    }
}
