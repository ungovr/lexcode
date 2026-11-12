// lexcode-expect: 6
// More texts, calls and pushes: Azure Communication Services SMS sent synchronously, a Twilio call placed
// synchronously, Web Push sent synchronously, a push through Lib.Net.Http.WebPush, and Amazon SNS texts built with a
// constructor and an initializer and with a bare initializer.
using Amazon.SimpleNotificationService.Model;
using Azure.Communication.Sms;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;
using WebPush;

namespace App.Alerts;

public class MoreChannels(SmsClient sms, WebPushClient webPush, Lib.Net.Http.WebPush.PushServiceClient pushService)
{
    public void Run(string phone, PushSubscription subscription, Lib.Net.Http.WebPush.PushSubscription libSubscription)
    {
        sms.Send(from: "+15550100", to: phone, message: "Your prescription is ready.");
        CallResource.Create(to: new PhoneNumber(phone), from: new PhoneNumber("+15550100"), url: new Uri("https://example.com/voice.xml"));
        webPush.SendNotification(subscription, "{\"title\":\"New arrivals\"}");
        _ = pushService.RequestPushMessageDeliveryAsync(libSubscription, new Lib.Net.Http.WebPush.PushMessage("New arrivals"));
        var a = new PublishRequest() { PhoneNumber = phone, Message = "Your order has shipped." };
        var b = new PublishRequest { PhoneNumber = phone, Message = "Pick-up day is tomorrow." };
    }
}
