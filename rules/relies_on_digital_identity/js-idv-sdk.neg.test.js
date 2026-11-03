// lexcode-expect: 0
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { ClerkProvider, SignIn } from '@clerk/nextjs';
import Stripe from 'stripe';

// Social sign-in through Auth.js is not an identity credential.
export const authOptions = {
  providers: [GoogleProvider({ clientId: process.env.GOOGLE_ID, clientSecret: process.env.GOOGLE_SECRET })],
};
export default NextAuth(authOptions);

// A password check.
passport.use(
  new LocalStrategy(async (username, password, done) => {
    const user = await findUser(username);
    if (!user || !(await bcrypt.compare(password, user.hash))) return done(null, false);
    return done(null, user);
  }),
);

// Clerk's hosted sign-in.
export function SignInPage() {
  return (
    <ClerkProvider>
      <SignIn routing="path" path="/sign-in" />
    </ClerkProvider>
  );
}

// WebAuthn passkeys sign a challenge with a key the person holds; no attribute is checked.
export async function signInWithPasskey(options) {
  const credential = await navigator.credentials.get({ publicKey: options });
  return fetch('/api/passkey/verify', { method: 'POST', body: JSON.stringify(credential) });
}

export async function registerPasskey(options) {
  return navigator.credentials.create({ publicKey: options });
}

// Stripe used for card payments only.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
export function charge(amount, customer) {
  return stripe.paymentIntents.create({ amount, currency: 'usd', customer });
}

// A local function that happens to be called verify.
export function verify(session) {
  return session.expiresAt > Date.now();
}

// A plain call to the app's own API, not an identity vendor.
export async function loadProfile() {
  return fetch('https://api.example.org/v1/profile');
}
