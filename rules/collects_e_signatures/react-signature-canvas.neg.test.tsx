// lexcode-expect: 0
import { useRef, useState } from 'react';

// A terms checkbox on a checkout form.
export function Checkout({ onPay }: { onPay: () => void }) {
  const [agreed, setAgreed] = useState(false);
  return (
    <form onSubmit={(e) => { e.preventDefault(); onPay(); }}>
      <label>
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        I have read and accept the terms and conditions
      </label>
      <button type="submit" disabled={!agreed}>Pay now</button>
    </form>
  );
}

// A drawing surface for a whiteboard, exported as a picture, not a signature.
export function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const exportPng = () => canvasRef.current?.toDataURL('image/png');
  return <canvas ref={canvasRef} width={800} height={600} onDoubleClick={exportPng} />;
}

// A form that shows the email signature of the sender.
export function Footer({ name }: { name: string }) {
  return <footer>Signed, {name}</footer>;
}
