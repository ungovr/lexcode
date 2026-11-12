// lexcode-expect: 4
// The AWS recording clients reached through namespace aliases, which only the fully qualified forms
// resolve: an Amazon Chime media-pipelines client injected through its interface and one the method
// builds, and the same for Amazon Connect.
using Chime = Amazon.ChimeSDKMediaPipelines;
using Cn = Amazon.Connect;

namespace Contoso.Notetaker;

public sealed class AliasedRecorder(Chime.IAmazonChimeSDKMediaPipelines pipelines, Cn.IAmazonConnect connect)
{
    public async Task RecordAsync(string meetingArn, string contactId, string instanceId)
    {
        await pipelines.CreateMediaCapturePipelineAsync(new() { SourceArn = meetingArn });
        Chime.AmazonChimeSDKMediaPipelinesClient built = new();
        await built.CreateMediaCapturePipelineAsync(new() { SourceArn = meetingArn });
        await connect.StartContactRecordingAsync(new() { ContactId = contactId, InstanceId = instanceId });
        Cn.AmazonConnectClient client = new();
        await client.StartContactRecordingAsync(new() { ContactId = contactId, InstanceId = instanceId });
    }
}
