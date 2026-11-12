// lexcode-expect: 8
using BoldSign.Api;
using BoldSign.Model;
using DocuSign.eSign.Api;
using DocuSign.eSign.Client;
using DocuSign.eSign.Model;
using Dropbox.Sign.Api;
using Ds = DocuSign.eSign.Api;
using Dbx = Dropbox.Sign.Api;

namespace MyShop.Leases;

// DocuSign: an envelopes API built in place, and one injected through a primary-constructor parameter
public class LeaseSigning(EnvelopesApi injected, string accountId)
{
    public void Send(ApiClient client, EnvelopeDefinition envelope)
    {
        var envelopes = new EnvelopesApi(client);
        envelopes.CreateEnvelope(accountId, envelope);                                    // 1 using
        Ds.EnvelopesApi aliased = new(client);
        aliased.CreateEnvelopeAsync(accountId, envelope);                                 // 2 alias, target-typed new()
        injected.CreateEnvelope(accountId, envelope);                                     // 3 injected
    }
}

// Dropbox Sign, injected through a constructor parameter
public class WaiverSigning
{
    private readonly SignatureRequestApi _requests;
    private readonly Dbx.SignatureRequestApi _embedded;

    public WaiverSigning(SignatureRequestApi requests, Dbx.SignatureRequestApi embedded)
    {
        _requests = requests;
        _embedded = embedded;
    }

    public void Send(object send, object embedded)
    {
        _requests.SignatureRequestSend(send);                                             // 4 using
        _embedded.SignatureRequestCreateEmbeddedWithTemplate(embedded);                   // 5 alias
    }
}

// BoldSign and the legacy HelloSign client
public class ConsentSigning(DocumentClient documents)
{
    public async Task SendAsync(SendForSign request, HelloSign.Client hello, object legacy)
    {
        await documents.SendDocumentAsync(request);                                       // 6
        documents.CreateEmbeddedRequestUrl(new EmbeddedDocumentRequest());               // 7
        hello.SendSignatureRequest(legacy);                                               // 8 fully qualified
    }
}
