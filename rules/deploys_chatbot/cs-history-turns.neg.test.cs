// lexcode-expect: 0
// Prompts built in steps and sent once: few-shot examples whose assistant turns are fixed text (Microsoft.Extensions.AI,
// Semantic Kernel), a one-shot call whose reply is returned, a reply saved to a record rather than to the list sent,
// an apology written into the history when the call fails, the app's own AddMessages (a validation result added to a
// list of messages and to the model state), an SQS poller adding a response's messages to a list, and the app's own
// ChatHistory and AssistantChatMessage classes, which are not Semantic Kernel's or OpenAI's.
using Microsoft.Extensions.AI;
using App.Support.Conversations;

namespace App.Support;

public class TicketClassifier(IChatClient chat, LabelStore labels, FormValidator validator)
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

    public void Validate(Form form, List<string> messages, ModelStateDictionary state)
    {
        var validationResult = validator.Validate(form);
        messages.AddMessages(validationResult);
        var result = validator.Validate(form);
        state.AddMessages(result);
    }

    public async Task<List<Amazon.SQS.Model.Message>> PollAsync(Amazon.SQS.IAmazonSQS sqs, string url)
    {
        var all = new List<Amazon.SQS.Model.Message>();
        var response = await sqs.ReceiveMessageAsync(new Amazon.SQS.Model.ReceiveMessageRequest { QueueUrl = url });
        all.AddRange(response.Messages);
        return all;
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
