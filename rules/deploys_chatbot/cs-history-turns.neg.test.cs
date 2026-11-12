// lexcode-expect: 0
// Prompts built in steps and sent once: few-shot examples whose assistant turns are fixed text (Microsoft.Extensions.AI,
// Semantic Kernel), a one-shot call whose reply is returned, a reply saved to a record rather than to the list sent,
// an apology written into the history when the call fails, an unrelated AddMessages on a list of form errors, and the
// app's own ChatHistory and AssistantChatMessage classes, which are not Semantic Kernel's or OpenAI's.
using Microsoft.Extensions.AI;
using App.Support.Conversations;

namespace App.Support;

public class TicketClassifier(IChatClient chat, LabelStore labels, FormErrors errors)
{
    public async Task<string> ClassifyAsync(string text)
    {
        List<ChatMessage> messages =
        [
            new ChatMessage(ChatRole.System, "Label the ticket as billing, bug or other."),
            new ChatMessage(ChatRole.User, "My card was charged twice."),
            new ChatMessage(ChatRole.Assistant, "billing"),
            new ChatMessage(ChatRole.User, text),
        ];
        var response = await chat.GetResponseAsync(messages);
        labels.Add(new Label { Text = text, Value = response.Text });
        return response.Text;
    }

    public async Task<string> SummarizeAsync(string document)
    {
        var response = await chat.GetResponseAsync($"Summarize: {document}");
        return response.Text;
    }

    public void Fail(IList<ChatMessage> history)
    {
        history.Add(new ChatMessage(ChatRole.Assistant, $"My apologies, but I encountered an unexpected error."));
    }

    public void Validate(IEnumerable<string> problems)
    {
        errors.AddMessages(problems);
    }

    public void Local(string question)
    {
        var history = new ChatHistory();
        history.AddUserMessage(question);
        history.AddAssistantMessage(question.ToUpperInvariant());
        history.Add(question);
        var reply = new AssistantChatMessage(question);
    }
}
