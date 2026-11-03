// lexcode-expect: 2
// Asks the person's wallet for a verifiable credential through the browser's Digital Credentials API.
export async function requestAgeCredential(nonce) {
  const response = await navigator.credentials.get({
    mediation: 'required',
    digital: {
      requests: [
        {
          protocol: 'openid4vp',
          data: { client_id: 'https://shop.example.org', nonce, response_type: 'vp_token' },
        },
      ],
    },
  });
  return fetch('/api/credential/verify', { method: 'POST', body: JSON.stringify(response) });
}

export async function requestIdentityDocument(request) {
  const credential = await navigator.credentials.get({ digital: { providers: [request] } });
  return credential.data;
}
