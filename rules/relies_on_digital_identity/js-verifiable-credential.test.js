// lexcode-expect: 4
import { verifyCredential, verifyPresentation } from 'did-jwt-vc';
import * as vc from '@digitalbazaar/vc';
import { Resolver } from 'did-resolver';
import { getResolver } from 'web-did-resolver';

const resolver = new Resolver(getResolver());

// A wallet sends a credential as a JWT; the check confirms who issued it and what it states.
export async function acceptCredential(jwt) {
  const verified = await verifyCredential(jwt, resolver);
  return verified.verifiableCredential.credentialSubject;
}

export async function acceptPresentation(jwt, challenge) {
  const verified = await verifyPresentation(jwt, resolver, { challenge });
  return verified.verifiablePresentation;
}

// The same step with a Linked Data Proof credential.
export async function acceptLdCredential(credential, suite, documentLoader) {
  const result = await vc.verifyCredential({ credential, suite, documentLoader });
  if (!result.verified) throw new Error('credential rejected');
  return result.results[0].credential;
}

export async function acceptLdPresentation(presentation, suite, documentLoader, challenge) {
  return vc.verify({ presentation, suite, documentLoader, challenge });
}
