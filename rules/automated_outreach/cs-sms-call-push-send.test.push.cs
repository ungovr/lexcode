// lexcode-expect: 5
// A text or a push the code sends: Vonage SMS, Azure Communication Services SMS (target-typed and injected), Web Push
// to a browser subscription, and an Azure Notification Hubs native push.
using Azure.Communication.Sms;
using Microsoft.Azure.NotificationHubs;
using Vonage.Messaging;
using WebPush;

namespace App.Alerts;

public class Channels(ISmsClient vonage, SmsClient injectedSms, NotificationHubClient hub)
{
    public Task VonageAsync(string phone) =>
        vonage.SendAnSmsAsync(new SendSmsRequest { To = phone, From = "Shop", Text = "Our spring sale starts today." });

    public async Task AzureSmsAsync(string connection, string phone)
    {
        SmsClient sms = new(connection);
        await sms.SendAsync(from: "+15550100", to: phone, message: "Your prescription is ready.");
        await injectedSms.SendAsync(from: "+15550100", to: phone, message: "Your prescription is ready.");
    }

    public async Task WebPushAsync(PushSubscription subscription, VapidDetails vapid)
    {
        var webPushClient = new WebPushClient();
        await webPushClient.SendNotificationAsync(subscription, "{\"title\":\"New arrivals\"}", vapid);
    }

    public Task HubAsync(string payload) => hub.SendFcmV1NativeNotificationAsync(payload);
}
