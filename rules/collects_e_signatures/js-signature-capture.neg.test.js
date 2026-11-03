// lexcode-expect: 0
import { useState } from 'react';

// A checkbox accepting the terms is not a signature.
export function TermsStep({ onAccept }) {
  const [accepted, setAccepted] = useState(false);
  return (
    <form onSubmit={(e) => { e.preventDefault(); onAccept(); }}>
      <label>
        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
        I agree to the terms of service
      </label>
      <button type="submit" disabled={!accepted}>Continue</button>
    </form>
  );
}

// An ordinary drawing canvas that has nothing to do with signing.
const canvas = document.querySelector('#chart');
export function snapshotChart() {
  return canvas.toDataURL('image/png');
}

// A pad of another kind: a name typed into a text field, never drawn or exported.
export function emailSignature(user) {
  return `${user.name}\n${user.title}`;
}
