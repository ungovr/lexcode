// lexcode-expect: 4
const docusign = require('docusign-esign');
const { HelloSign } = require('hellosign-sdk');
const DropboxSign = require('@dropbox/sign');

const apiClient = new docusign.ApiClient();
apiClient.setBasePath(process.env.DOCUSIGN_BASE_PATH);
const envelopesApi = new docusign.EnvelopesApi(apiClient);

const hellosign = new HelloSign({ key: process.env.HELLOSIGN_API_KEY });
const signatureApi = new DropboxSign.SignatureRequestApi();
signatureApi.username = process.env.DROPBOX_SIGN_API_KEY;

// Sends a lease to the tenant for signature through DocuSign.
async function sendLease(accountId, tenant, pdfBase64) {
  const envelope = {
    emailSubject: 'Please sign your lease',
    documents: [{ documentBase64: pdfBase64, name: 'Lease', fileExtension: 'pdf', documentId: '1' }],
    recipients: { signers: [{ email: tenant.email, name: tenant.name, recipientId: '1', routingOrder: '1' }] },
    status: 'sent',
  };
  const result = await envelopesApi.createEnvelope(accountId, { envelopeDefinition: envelope });
  return result.envelopeId;
}

// The same request through the older HelloSign SDK.
async function sendNda(signer, file) {
  return hellosign.signatureRequest.send({
    test_mode: 0,
    title: 'Mutual NDA',
    subject: 'Please sign the NDA',
    signers: [{ email_address: signer.email, name: signer.name }],
    files: [file],
  });
}

// And through the current Dropbox Sign SDK, once embedded and once by email.
async function sendEmbedded(signer, file) {
  return signatureApi.signatureRequestCreateEmbedded({
    clientId: process.env.DROPBOX_SIGN_CLIENT_ID,
    title: 'Engagement letter',
    signers: [{ emailAddress: signer.email, name: signer.name }],
    files: [file],
  });
}

async function sendByEmail(signer, file) {
  return signatureApi.signatureRequestSend({
    title: 'Engagement letter',
    signers: [{ emailAddress: signer.email, name: signer.name }],
    files: [file],
  });
}

module.exports = { sendLease, sendNda, sendEmbedded, sendByEmail };
