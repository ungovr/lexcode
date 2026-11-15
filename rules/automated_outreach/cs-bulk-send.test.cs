// lexcode-expect: 11
// One message to many recipients in one call: Firebase multicast (the default instance, under an alias, an injected
// client), Amazon SES bulk sends, SendGrid's multiple-recipient helpers (under the import and an alias), a Brevo
// campaign sent now, a Mailchimp campaign send, a Twilio Notify broadcast, and Amazon Pinpoint and Postmark batches.
using Amazon.Pinpoint;
using Amazon.SimpleEmailV2;
using FirebaseAdmin.Messaging;
using PostmarkDotNet;
using SendGrid.Helpers.Mail;
using Twilio.Rest.Notify.V1.Service;
using Fcm = FirebaseAdmin.Messaging;
using Sg = SendGrid.Helpers.Mail;

namespace App.Campaigns;

public class Blast(FirebaseMessaging messaging, IAmazonSimpleEmailServiceV2 ses, IAmazonPinpoint pinpoint, PostmarkClient postmark)
{
    public async Task PushAsync(IReadOnlyList<string> tokens)
    {
        await FirebaseMessaging.DefaultInstance.SendEachForMulticastAsync(new MulticastMessage { Tokens = tokens, Notification = new Notification { Title = "Sale" } });
        await Fcm.FirebaseMessaging.DefaultInstance.SendMulticastAsync(new Fcm.MulticastMessage { Tokens = tokens });
        await messaging.SendEachAsync(tokens.Select(t => new Message { Token = t }));
    }

    public async Task EmailAsync(Amazon.SimpleEmailV2.Model.SendBulkEmailRequest request, List<EmailAddress> customers)
    {
        await ses.SendBulkEmailAsync(request);
        var one = MailHelper.CreateSingleEmailToMultipleRecipients(new EmailAddress("shop@example.com"), customers, "Spring sale", "Sale", "<p>Sale</p>");
        var many = Sg.MailHelper.CreateMultipleEmailsToMultipleRecipients(new Sg.EmailAddress("shop@example.com"), customers, ["Hi"], "Sale", "<p>Sale</p>", []);
    }

    public async Task CampaignsAsync(brevo_csharp.Api.EmailCampaignsApi brevo, MailChimp.Net.Interfaces.IMailChimpManager mailchimp, long id)
    {
        await brevo.SendEmailCampaignNowAsync(id);
        await mailchimp.Campaigns.SendAsync(id.ToString());
        NotificationResource.Create("IS0000", identity: ["all-customers"], body: "Our spring sale starts today.");
    }

    public async Task BatchesAsync(Amazon.Pinpoint.Model.SendMessagesRequest request, IEnumerable<PostmarkMessage> messages)
    {
        await pinpoint.SendMessagesAsync(request);
        await postmark.SendMessagesAsync(messages);
    }
}
