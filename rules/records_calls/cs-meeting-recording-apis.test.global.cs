// lexcode-expect: 4
// The AWS recording clients with their namespaces imported by a `global using` in another file, so this
// file has no using lines and only the vendor-named short forms find them: an Amazon Chime media-pipelines
// client injected and one the method builds, and the same for Amazon Connect.
namespace Contoso.Notetaker;

public sealed class GlobalRecorder(IAmazonChimeSDKMediaPipelines pipelines, IAmazonConnect connect)
{
    public async Task RecordAsync(string meetingArn, string contactId, string instanceId)
    {
        await pipelines.CreateMediaCapturePipelineAsync(new() { SourceArn = meetingArn });
        var built = new AmazonChimeSDKMediaPipelinesClient();
        await built.CreateMediaCapturePipelineAsync(new() { SourceArn = meetingArn });
        await connect.StartContactRecordingAsync(new() { ContactId = contactId, InstanceId = instanceId });
        var client = new AmazonConnectClient();
        await client.StartContactRecordingAsync(new() { ContactId = contactId, InstanceId = instanceId });
    }
}
