// lexcode-expect: 0
// Calls and meetings the app only sets up or connects, without keeping or reading them: an Azure
// Communication Services call placed and hung up, an Amazon Connect outbound call, a Vonage talk action,
// a Teams meeting created and read through Microsoft Graph, and a Zoom meeting created over HTTP.
// The app's own meeting archive with the same property chain as Graph is not Graph.
// Look-alikes: the app's own StartRecordingOptions and RecordAction in another namespace.
using Amazon.Connect;
using Amazon.Connect.Model;
using Azure.Communication.CallAutomation;
using Microsoft.Graph;
using Microsoft.Graph.Models;
using Nccos = Vonage.Voice.Nccos;

namespace Contoso.Scheduling;

public sealed class MeetingSetup(CallAutomationClient calls, IAmazonConnect connect, GraphServiceClient graph)
{
    private const string ZoomCreate = "https://api.zoom.us/v2/users/me/meetings";

    public async Task CallAsync(CallInvite invite, Uri callback, string connectionId)
    {
        await calls.CreateCallAsync(invite, callback);
        await calls.GetCallConnection(connectionId).HangUpAsync(forEveryone: true);
        await connect.StartOutboundVoiceContactAsync(new StartOutboundVoiceContactRequest { DestinationPhoneNumber = "+15555550100" });
        var talk = new Nccos.TalkAction { Text = "Your appointment is confirmed." };
    }

    public async Task TeamsAsync(string userId, string meetingId, Contoso.Studio.MeetingArchive archive)
    {
        await graph.Users[userId].OnlineMeetings.PostAsync(new OnlineMeeting { Subject = "Weekly sync" });
        var meeting = await graph.Users[userId].OnlineMeetings[meetingId].GetAsync();
        var ownRecordings = archive.Users[userId].OnlineMeetings[meetingId].Recordings;
        var ownTranscripts = archive.Me.OnlineMeetings[meetingId].Transcripts;
        var ownByRoot = archive.Communications.OnlineMeetings[meetingId].Recordings;
    }

    public void Local()
    {
        var take = new Contoso.Studio.StartRecordingOptions("studio-a");
        var action = new Contoso.Studio.RecordAction { Track = 2 };
    }
}
