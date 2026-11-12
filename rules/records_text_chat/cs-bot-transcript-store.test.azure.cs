// lexcode-expect: 3
// Transcript stores built on their own: the blob store with a plain constructor, and the older Azure blob transcript
// store constructed and target-typed.
using Microsoft.Bot.Builder.Azure;
using Microsoft.Bot.Builder.Azure.Blobs;

namespace App.Bots;

public static class TranscriptStores
{
    public static object Blobs(string connection) => new BlobsTranscriptStore(connection, "transcripts");

    public static object Legacy(string connection) => new AzureBlobTranscriptStore(connection, "transcripts");

    public static object LegacyTargetTyped(string connection)
    {
        AzureBlobTranscriptStore store = new(connection, "transcripts");
        return store;
    }
}
