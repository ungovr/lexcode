# lexcode-expect: 4
import didkit
import onfido
import stripe


def start_identity_check(user_id: str) -> str:
    # Opens a Stripe Identity check before an account can receive payouts.
    session = stripe.identity.VerificationSession.create(
        type="document",
        metadata={"user_id": user_id},
    )
    return session.client_secret


def onfido_client(token: str):
    return onfido.Api(token)


async def accept_credential(credential_json: str, options_json: str) -> bool:
    # A wallet sent a verifiable credential; check the issuer's proof.
    result = await didkit.verify_credential(credential_json, options_json)
    return not didkit.json.loads(result)["errors"]


async def accept_presentation(presentation_json: str, options_json: str) -> str:
    return await didkit.verify_presentation(presentation_json, options_json)
