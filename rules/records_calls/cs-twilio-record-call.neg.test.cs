// lexcode-expect: 0
// Calls and rooms the app only connects, without keeping them: a Twilio call placed with no recording or
// with recording turned off, call options that say not to record, a video room that does not record its
// participants, and a text message. Look-alikes: the app's own CallResource and CreateCallOptions in
// another namespace, with record options of their own.
using Twilio.Rest.Api.V2010.Account;
using Video = Twilio.Rest.Video.V1;

namespace Contoso.Dispatch;

public sealed class DispatchService
{
    public async Task CallAsync(Twilio.Types.PhoneNumber to, Twilio.Types.PhoneNumber from)
    {
        await CallResource.CreateAsync(to: to, from: from, url: new Uri("https://example.com/twiml"));
        CallResource.Create(to: to, from: from, record: false);
        var options = new CreateCallOptions(to, from) { Record = false, Timeout = 20 };
        await Video.RoomResource.CreateAsync(uniqueName: "standup", recordParticipantsOnConnect: false);
        await MessageResource.CreateAsync(to: to, from: from, body: "Your driver is on the way.");
    }

    public void Local()
    {
        Contoso.Crm.CallResource.Create(record: true);
        var own = new Contoso.Crm.CreateCallOptions { Record = true };
    }
}
