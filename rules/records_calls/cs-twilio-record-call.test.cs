// lexcode-expect: 7
// Recording calls through Twilio's REST API: a call placed with recording on (named arguments, call
// options in an initializer and target-typed, and options set after construction), recording a call that
// is in progress (aliased), and a video room that records its participants.
using Twilio.Rest.Api.V2010.Account;
using Twilio.Rest.Video.V1;
using CallRec = Twilio.Rest.Api.V2010.Account.Call;

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

        await RoomResource.CreateAsync(uniqueName: "consult", recordParticipantsOnConnect: true);
    }
}
