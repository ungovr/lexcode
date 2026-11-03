// lexcode-expect: 3
package identity

import (
	"github.com/hyperledger/aries-framework-go/pkg/doc/verifiable"
	"github.com/stripe/stripe-go/v79"
	"github.com/stripe/stripe-go/v79/identity/verificationsession"
)

// StartCheck opens a Stripe Identity check for a new customer.
func StartCheck(userID string) (string, error) {
	params := &stripe.IdentityVerificationSessionParams{
		Type: stripe.String("document"),
	}
	params.AddMetadata("user_id", userID)
	vs, err := verificationsession.New(params)
	if err != nil {
		return "", err
	}
	return vs.ClientSecret, nil
}

// AcceptCredential reads and checks a verifiable credential a wallet sent.
func AcceptCredential(raw []byte) (*verifiable.Credential, error) {
	return verifiable.ParseCredential(raw, verifiable.WithJSONLDDocumentLoader(nil))
}

func AcceptPresentation(raw []byte) (*verifiable.Presentation, error) {
	return verifiable.ParsePresentation(raw)
}
