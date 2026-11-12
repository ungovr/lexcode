// lexcode-expect: 6
// More one-to-many sends: Firebase's SendEachAsync and SendAllAsync on the default instance (short and fully
// qualified), an Amazon Pinpoint client constructed and typed by its class, SendGrid's template helpers for many
// recipients, and a Twilio Notify broadcast sent asynchronously.
using Amazon.Pinpoint;
using FirebaseAdmin.Messaging;
using SendGrid.Helpers.Mail;
using Twilio.Rest.Notify.V1.Service;

namespace App.Campaigns;

public class MoreBlasts
{
    public async Task RunAsync(IReadOnlyList<Message> pushes, Amazon.Pinpoint.Model.SendMessagesRequest request, List<EmailAddress> customers)
    {
        await FirebaseMessaging.DefaultInstance.SendEachAsync(pushes);
        await FirebaseAdmin.Messaging.FirebaseMessaging.DefaultInstance.SendAllAsync(pushes);
        var pinpoint = new AmazonPinpointClient();
        await pinpoint.SendMessagesAsync(request);
        var one = MailHelper.CreateSingleTemplateEmailToMultipleRecipients(new EmailAddress("shop@example.com"), customers, "d-spring-sale", new { });
        var many = MailHelper.CreateMultipleTemplateEmailsToMultipleRecipients(new EmailAddress("shop@example.com"), customers, "d-spring-sale", [new { }]);
        await NotificationResource.CreateAsync("IS0000", identity: ["all-customers"], body: "Our spring sale starts today.");
    }
}
