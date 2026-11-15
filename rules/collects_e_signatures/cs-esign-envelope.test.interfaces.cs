// lexcode-expect: 5
using BoldSign.Api;
using DocuSign.eSign.Api;
using Dropbox.Sign.Api;

namespace MyShop.Leases;

// Each vendor's interface, injected through a primary-constructor parameter, and BoldSign's template
// client by class and by interface.
public class LeaseSigningByInterface(
    IEnvelopesApi envelopes,
    ISignatureRequestApi requests,
    IDocumentClient documents,
    TemplateClient templates,
    ITemplateClient templatesByInterface)
{
    public async Task SendAsync(object definition)
    {
        envelopes.CreateEnvelope("account", definition);                                  // 1
        requests.SignatureRequestSend(definition);                                        // 2
        await documents.SendDocumentAsync(definition);                                    // 3
        await templates.SendUsingTemplateAsync(definition);                               // 4
        await templatesByInterface.SendUsingTemplateAsync(definition);                    // 5
    }
}
