// lexcode-expect: 2
import SignaturePad from 'signature_pad';

const canvas = document.querySelector('#signature');
const pad = new SignaturePad(canvas, { backgroundColor: 'rgb(255, 255, 255)' });

// Saves the drawn signature as the customer's signed delivery record.
export async function saveSignature(orderId) {
  if (pad.isEmpty()) return;
  const image = pad.toDataURL('image/png');
  await fetch(`/api/orders/${orderId}/signature`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ image }),
  });
}

export function signatureVector() {
  return pad.toData();
}
