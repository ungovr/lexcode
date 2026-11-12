// lexcode-expect: 5
// More loops that send once per recipient: Parallel.ForEach in its short and fully qualified forms,
// Parallel.ForEachAsync fully qualified, a Twilio call placed synchronously in a braceless foreach, and the app's own
// send method called unqualified.
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;

namespace App.Campaigns;

public class Fanout(IMailer mail)
{
    public void Run(List<Customer> customers)
    {
        Parallel.ForEach(customers, c => mail.SendWelcomeEmail(c.Email));
        System.Threading.Tasks.Parallel.ForEach(customers, c => mail.SendReminderEmail(c.Email));
    }

    public Task RunAsync(List<Customer> customers) =>
        System.Threading.Tasks.Parallel.ForEachAsync(customers, async (c, ct) => await mail.SendDigestAsync(c.Email));

    public void Calls(IEnumerable<Customer> customers)
    {
        foreach (var c in customers)
            CallResource.Create(to: new PhoneNumber(c.Phone), from: new PhoneNumber("+15550100"), url: new Uri("https://example.com/voice.xml"));
    }

    public void Own(IEnumerable<Customer> customers)
    {
        foreach (var c in customers)
        {
            SendNewsletterEmail(c.Email);
        }
    }

    private void SendNewsletterEmail(string email) => mail.Queue(email);
}
