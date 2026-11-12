// lexcode-expect: 7
// A text, a call or a push the code sends: Twilio texts (under the import and an alias) and a call, Firebase pushes
// (the default instance and an injected client), and Amazon SNS texts to a phone number (constructed and
// target-typed).
using Amazon.SimpleNotificationService;
using Amazon.SimpleNotificationService.Model;
using FirebaseAdmin.Messaging;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;
using Tw = Twilio.Rest.Api.V2010.Account;

namespace App.Alerts;

public class Notifier(FirebaseMessaging messaging, IAmazonSimpleNotificationService sns)
{
    public void TableReady(string phone) =>
        MessageResource.Create(to: new PhoneNumber(phone), from: new PhoneNumber("+15550100"), body: "Your table is ready.");

    public Task ShippedAsync(string phone) =>
        Tw.MessageResource.CreateAsync(to: new PhoneNumber(phone), from: new PhoneNumber("+15550100"), body: "Your order has shipped.");

    public Task CallAsync(string phone) =>
        CallResource.CreateAsync(to: new PhoneNumber(phone), from: new PhoneNumber("+15550100"), url: new Uri("https://example.com/voice.xml"));

    public Task PushAsync(string token) =>
        FirebaseMessaging.DefaultInstance.SendAsync(new Message { Token = token, Notification = new Notification { Title = "Back in stock" } });

    public Task InjectedPushAsync(string token) =>
        messaging.SendAsync(new Message { Token = token, Data = new Dictionary<string, string> { ["kind"] = "price-drop" } });

    public Task SnsAsync(string phone) =>
        sns.PublishAsync(new PublishRequest { PhoneNumber = phone, Message = "Your order has shipped." });

    public Task SnsTargetTypedAsync(string phone)
    {
        PublishRequest request = new() { PhoneNumber = phone, Message = "Pick-up day is tomorrow." };
        return sns.PublishAsync(request);
    }
}
