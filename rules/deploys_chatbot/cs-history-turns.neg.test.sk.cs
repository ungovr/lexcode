// lexcode-expect: 0
// Few-shot prompts whose assistant turns are fixed text, with Semantic Kernel's ChatHistory and the OpenAI SDK's
// AssistantChatMessage, each sent once; the reply is returned, not added back.
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using OpenAI.Chat;

namespace App.Labels;

public class FewShot(IChatCompletionService completions, ChatClient openai)
{
    public async Task<string> LabelAsync(string text)
    {
        var history = new ChatHistory("Label the ticket as billing, bug or other.");
        history.AddUserMessage("My card was charged twice.");
        history.AddAssistantMessage("billing");
        history.AddMessage(AuthorRole.Assistant, """bug""");
        history.AddUserMessage(text);
        var result = await completions.GetChatMessageContentAsync(history);
        return result.Content ?? "";
    }

    public async Task<string> LabelWithOpenAiAsync(string text)
    {
        List<OpenAI.Chat.ChatMessage> messages =
        [
            new SystemChatMessage("Label the ticket as billing, bug or other."),
            new UserChatMessage("My card was charged twice."),
            new AssistantChatMessage("billing"),
            ChatMessage.CreateAssistantMessage(@"other"),
            new UserChatMessage(text),
        ];
        ChatCompletion completion = await openai.CompleteChatAsync(messages);
        return completion.Content[0].Text;
    }
}
