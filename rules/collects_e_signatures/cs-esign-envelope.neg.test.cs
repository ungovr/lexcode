// lexcode-expect: 0
using System.ComponentModel.DataAnnotations;
using DocuSign.eSign.Api;

namespace MyShop.Mail;

// Accepting the terms with a checkbox is contract formation, not a signature. Reading back an
// envelope's status sends nothing for signature, and the app's own mail envelopes and signature
// requests are not the vendors'.
public class SignupForm
{
    [Range(typeof(bool), "true", "true")]
    public bool AcceptTerms { get; set; }
}

public class StatusPoller(EnvelopesApi envelopes, string accountId)
{
    public string Poll(string envelopeId) => envelopes.GetEnvelope(accountId, envelopeId).Status;
}

public class MailEnvelopes
{
    public void CreateEnvelope(string address, string body) { }
}

public class SignatureRequestApi
{
    public void SignatureRequestSend(string webhookSecret) { }
}

public class Mailer(MailEnvelopes mail, SignatureRequestApi webhooks)
{
    public void Run()
    {
        mail.CreateEnvelope("ops@example.com", "statement");
        webhooks.SignatureRequestSend("whsec");
    }
}
