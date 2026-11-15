// lexcode-expect: 16
// Recording calls and meetings through platform APIs: Azure Communication Services call recording
// (options in an initializer, target-typed, and passed target-typed to an injected client), an Amazon
// Chime capture pipeline and Amazon Connect contact recording (injected, and a client the method
// builds), a Vonage record action (aliased, and target-typed), Teams meeting recordings and transcripts
// through Microsoft Graph v1.0 and beta (aliased), from a user, the signed-in user and the communications
// root, and Zoom recordings and a notetaker bot named in strings.
using Amazon.ChimeSDKMediaPipelines;
using Amazon.ChimeSDKMediaPipelines.Model;
using Amazon.Connect;
using Azure.Communication.CallAutomation;
using Microsoft.Graph;
using GraphBeta = Microsoft.Graph.Beta;
using Ncco = Vonage.Voice.Nccos;

namespace Contoso.Notetaker;

public sealed class MeetingRecorder(CallAutomationClient calls, IAmazonChimeSDKMediaPipelines pipelines, GraphServiceClient graph)
{
    private const string RecallBots = "https://us-east-1.recall.ai/api/v1/bot/";

    public async Task AcsAsync(string serverCallId)
    {
        var options = new StartRecordingOptions(new ServerCallLocator(serverCallId))
        {
            RecordingContent = RecordingContent.Audio,
            RecordingChannel = RecordingChannel.Unmixed,
        };
        await calls.GetCallRecording().StartAsync(options);
        StartRecordingOptions typed = new(new ServerCallLocator(serverCallId));
        await calls.GetCallRecording().StartAsync(new(new ServerCallLocator(serverCallId)) { RecordingFormat = RecordingFormat.Wav });
    }

    public async Task AwsAsync(string meetingArn, string contactId, string instanceId)
    {
        await pipelines.CreateMediaCapturePipelineAsync(new CreateMediaCapturePipelineRequest { SourceArn = meetingArn, SourceType = MediaPipelineSourceType.ChimeSdkMeeting });
        using var connect = new AmazonConnectClient();
        await connect.StartContactRecordingAsync(new() { ContactId = contactId, InstanceId = instanceId, InitialContactId = contactId });
    }

    public object Vonage() => new Ncco.RecordAction { EventUrl = new[] { "https://example.com/recording" }, Split = "conversation" };

    public object VonageTyped()
    {
        Ncco.RecordAction action = new() { Split = "conversation", Channels = 2 };
        return action;
    }

    public async Task TeamsAsync(string userId, string meetingId)
    {
        var recordings = await graph.Users[userId].OnlineMeetings[meetingId].Recordings.GetAsync();
        var transcripts = await graph.Me.OnlineMeetings[meetingId].Transcripts.GetAsync();
        var byRoot = await graph.Communications.OnlineMeetings[meetingId].Recordings.GetAsync();
    }

    public async Task TeamsBetaAsync(GraphBeta.GraphServiceClient beta, string userId, string meetingId)
    {
        var recordings = await beta.Users[userId].OnlineMeetings[meetingId].Recordings.GetAsync();
        var transcripts = await beta.Me.OnlineMeetings[meetingId].Transcripts.GetAsync();
        var byRoot = await beta.Communications.OnlineMeetings[meetingId].Transcripts.GetAsync();
    }

    public string ZoomRecordings(string meetingId) => $"https://api.zoom.us/v2/meetings/{meetingId}/recordings";
}
