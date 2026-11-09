// lexcode-expect: 1
// The same check typed: a selfie and an ID card image in one request body.
interface VerificationBody {
  selfieBase64: string;
  idCardImage: string;
}

export function body(selfie: string, card: string): VerificationBody {
  return { selfieBase64: selfie, idCardImage: card };
}
