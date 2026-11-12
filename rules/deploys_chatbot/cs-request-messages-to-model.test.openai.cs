// lexcode-expect: 3
// The OpenAI SDK's other chat calls given the request's conversation: the synchronous call, and the streamed calls,
// synchronous and asynchronous, with the client injected through a primary constructor.
using OpenAI.Chat;

namespace App.Chat;

public class StreamingChat(ChatClient client)
{
    public string Reply(ChatRequest request) => client.CompleteChat(request.Messages).Value.Content[0].Text;

    public IAsyncEnumerable<StreamingChatCompletionUpdate> StreamAsync(ChatRequest request) =>
        client.CompleteChatStreamingAsync(request.Messages);

    public IEnumerable<StreamingChatCompletionUpdate> Stream(ChatRequest request) =>
        client.CompleteChatStreaming(request.History);
}
