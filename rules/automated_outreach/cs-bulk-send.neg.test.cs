// lexcode-expect: 0
// One message to one person: SendGrid's single-recipient helper and an Amazon SES single send in a controller action a
// person triggered. A telemetry batch flushed with SendAllAsync sends no one a message. A campaign record saved is not
// a campaign sent. The app's own MailHelper (a template renderer in the app's namespace) is not SendGrid's.
using Amazon.SimpleEmailV2;
using Amazon.SimpleEmailV2.Model;
using App.Templates;

namespace App.Mail;

public class OrderMail(IAmazonSimpleEmailServiceV2 ses, ITelemetryBatch telemetry, AppDb db)
{
    public SendGrid.Helpers.Mail.SendGridMessage Receipt(string email) =>
        SendGrid.Helpers.Mail.MailHelper.CreateSingleEmail(new("shop@example.com"), new(email), "Your receipt", "Thanks", "<p>Thanks</p>");

    public Task<SendEmailResponse> ShippedAsync(SendEmailRequest request) => ses.SendEmailAsync(request);

    public Task FlushAsync() => telemetry.SendAllAsync();

    public Task DraftAsync(Campaign campaign)
    {
        db.Campaigns.Add(campaign);
        return db.SaveChangesAsync();
    }

    public string Preview(IEnumerable<string> to) => MailHelper.CreateSingleEmailToMultipleRecipients(to, "spring-sale");
}
