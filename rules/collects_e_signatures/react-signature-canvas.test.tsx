// lexcode-expect: 2
import { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

export function SignAgreement({ agreementId }: { agreementId: string }) {
  const pad = useRef<SignatureCanvas>(null);

  async function submit() {
    if (!pad.current || pad.current.isEmpty()) return;
    // The drawn signature is posted as the signed record.
    const png = pad.current.getTrimmedCanvas().toDataURL('image/png');
    await fetch(`/api/agreements/${agreementId}/sign`, {
      method: 'POST',
      body: JSON.stringify({ png }),
    });
  }

  function preview() {
    return pad.current?.getTrimmedCanvas();
  }

  return (
    <div>
      <SignatureCanvas ref={pad} canvasProps={{ width: 500, height: 200 }} />
      <button onClick={submit}>Sign and send</button>
      <button onClick={() => pad.current?.clear()}>Clear</button>
    </div>
  );
}
