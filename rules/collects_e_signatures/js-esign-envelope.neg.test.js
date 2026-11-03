// lexcode-expect: 0
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { execFileSync } = require('child_process');
const Stripe = require('stripe');

// A JWT is "signed", but no person signs anything.
function issueToken(user, secret) {
  return jwt.sign({ sub: user.id }, secret, { expiresIn: '15m' });
}

// An HMAC "signature" authenticates a webhook body.
function verifyWebhook(rawBody, header, secret) {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(header));
}

function stripeEvent(rawBody, signature, secret) {
  const stripe = new Stripe(process.env.STRIPE_KEY);
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}

// Signing a release build is code signing.
function signBinary(path, identity) {
  execFileSync('codesign', ['--sign', identity, '--timestamp', path]);
}

function signManifest(manifest, privateKeyPem) {
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(JSON.stringify(manifest));
  return signer.sign(privateKeyPem, 'base64');
}

// A message envelope in the app's own queue is not an e-signature envelope.
class Mailbox {
  createEnvelope(to, body) {
    return { to, body, sentAt: Date.now() };
  }
}

const box = new Mailbox();
const reply = box.createEnvelope('a@example.org', 'hello');

// A server-side request helper with a signatureRequest field of its own.
const client = { signatureRequest: { list: () => [] } };
const pending = client.signatureRequest.list();

module.exports = { issueToken, verifyWebhook, stripeEvent, signBinary, signManifest, reply, pending };
