// lexcode-expect: 0
// Texts a person asked for at that moment: a sign-in code, a phone verification through Twilio Verify, a one-time
// passcode through Vonage, and a code through Amazon SNS; and an SNS publish to a topic rather than a phone. The app's own MessageResource (a
// translation table in the app's namespace) is not Twilio's.
using Amazon.SimpleNotificationService.Model;
using App.Localization;
using Twilio.Rest.Verify.V2.Service;

namespace App.SignIn;

public class Codes(Vonage.Messaging.ISmsClient vonage, Amazon.SimpleNotificationService.IAmazonSimpleNotificationService sns)
{
    public void SignInCode(string phone, string code) =>
        Twilio.Rest.Api.V2010.Account.MessageResource.Create(to: new Twilio.Types.PhoneNumber(phone), from: new Twilio.Types.PhoneNumber("+15550100"), body: $"Your sign-in code is {code}");

    public void Verify(string phone) => VerificationResource.Create(to: phone, channel: "sms", pathServiceSid: "VA000");

    public Task Otp(string phone, string otp) =>
        vonage.SendAnSmsAsync(new Vonage.Messaging.SendSmsRequest { To = phone, From = "Shop", Text = $"Passcode: {otp}" });

    public Task Topic(string arn) => sns.PublishAsync(new PublishRequest { TopicArn = arn, Message = "inventory-updated" });

    public Task SnsCode(string phone, string code) => sns.PublishAsync(new PublishRequest { PhoneNumber = phone, Message = $"Your code is {code}" });

    public void Label(string locale) => MessageResource.Create(locale, "welcome");
}
