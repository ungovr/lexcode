# lexcode-expect: 3
from docusign_esign import ApiClient, EnvelopesApi, EnvelopeDefinition
from dropbox_sign import ApiClient as SignClient, Configuration, apis, models
from hellosign_sdk import HSClient

api_client = ApiClient()
api_client.host = "https://demo.docusign.net/restapi"
envelopes_api = EnvelopesApi(api_client)

sign_config = Configuration(username="api-key")
hs_client = HSClient(api_key="api-key")


def send_contract(account_id: str, signer_email: str, signer_name: str, pdf_b64: str) -> str:
    """Asks the client to sign the engagement contract through DocuSign."""
    definition = EnvelopeDefinition(
        email_subject="Please sign your engagement contract",
        status="sent",
    )
    summary = envelopes_api.create_envelope(account_id, envelope_definition=definition)
    return summary.envelope_id


def send_with_dropbox_sign(signer_email: str, signer_name: str, path: str):
    with SignClient(sign_config) as client:
        signature_api = apis.SignatureRequestApi(client)
        data = models.SignatureRequestSendRequest(
            title="Service agreement",
            signers=[models.SubSignatureRequestSigner(email_address=signer_email, name=signer_name)],
            files=[open(path, "rb")],
        )
        return signature_api.signature_request_send(data)


def send_with_hellosign(signer_email: str, signer_name: str, path: str):
    return hs_client.send_signature_request(
        title="Service agreement",
        subject="Please sign",
        signers=[{"email_address": signer_email, "name": signer_name}],
        files=[path],
    )
