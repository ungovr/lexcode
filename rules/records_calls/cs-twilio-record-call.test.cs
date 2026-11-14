// lexcode-expect: 12
// Recording calls through Twilio's REST API: a call placed with recording on (named arguments, sync and
// async; call options in an initializer, target-typed, and set after construction), recording a call that
// is in progress (aliased, sync and async), and a video room that records its participants (imported and
// aliased, sync and async; room options in an initializer, target-typed, and set afterwards).
using Twilio.Rest.Api.V2010.Account;
using Twilio.Rest.Video.V1;
using CallRec = Twilio.Rest.Api.V2010.Account.Call;
using Rooms = Twilio.Rest.Video.V1;

namespace Contoso.SupportLine;

public sealed class OutboundCalls
{
    public async Task CallAsync(Twilio.Types.PhoneNumber to, Twilio.Types.PhoneNumber from, bool keep)
    {
        await CallResource.CreateAsync(to: to, from: from, url: new Uri("https://example.com/twiml"), record: true);
        var call = CallResource.Create(to: to, from: from, record: keep);

        var options = new CreateCallOptions(to, from) { Record = true, RecordingChannels = "dual" };
        CreateCallOptions typed = new(to, from) { Record = true };
        var later = new CreateCallOptions(to, from);
        later.Record = true;
        await CallResource.CreateAsync(later);

        await CallRec.RecordingResource.CreateAsync(pathCallSid: call.Sid, recordingChannels: "dual");
        CallRec.RecordingResource.Create(pathCallSid: call.Sid);
    }

    public async Task RoomsAsync()
    {
        await RoomResource.CreateAsync(uniqueName: "consult", recordParticipantsOnConnect: true);
        Rooms.RoomResource.Create(uniqueName: "intake", recordParticipantsOnConnect: true);
        var options = new CreateRoomOptions { UniqueName = "review", RecordParticipantsOnConnect = true };
        CreateRoomOptions typed = new() { RecordParticipantsOnConnect = true };
        var later = new Rooms.CreateRoomOptions();
        later.RecordParticipantsOnConnect = true;
        await RoomResource.CreateAsync(later);
    }
}
