// lexcode-expect: 6
import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';
import { Onfido } from '@onfido/api';
import Persona from 'persona';
import { Veriff } from '@veriff/js-sdk';
import Yoti from 'yoti';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const onfido = new Onfido({ apiToken: process.env.ONFIDO_TOKEN });
const yoti = new Yoti.Client(process.env.YOTI_SDK_ID, process.env.YOTI_PEM);

// Server: opens a Stripe Identity check for a new host before payouts are enabled.
export async function startPayoutCheck(userId) {
  const session = await stripe.identity.verificationSessions.create({
    type: 'document',
    metadata: { user_id: userId },
    options: { document: { require_matching_selfie: true } },
  });
  return session.client_secret;
}

// Browser: hands the client secret to Stripe's hosted flow.
export async function runStripeFlow(clientSecret) {
  const client = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY);
  return client.verifyIdentity(clientSecret);
}

// Server: an Onfido SDK token for the applicant's browser or phone.
export async function onfidoToken(applicantId) {
  return onfido.sdkToken.generate({ applicantId });
}

// Browser: Persona inquiry opened for the signed-in user.
export function openPersona(templateId, userId) {
  const client = new Persona.Client({
    templateId,
    referenceId: userId,
    onComplete: ({ inquiryId }) => console.log(inquiryId),
  });
  client.open();
}

// Browser: Veriff frame to confirm who the person is.
export function openVeriff(user) {
  const veriff = Veriff({
    apiKey: process.env.VERIFF_KEY,
    parentId: 'veriff-root',
    onSession: (err, response) => window.location.assign(response.verification.url),
  });
  veriff.setParams({ person: { givenName: user.first, lastName: user.last } });
  veriff.mount();
}

// Server: reads the attributes a person shared from their Yoti app.
export async function readYoti(token) {
  const activity = await yoti.getActivityDetails(token);
  return activity.getProfile();
}
