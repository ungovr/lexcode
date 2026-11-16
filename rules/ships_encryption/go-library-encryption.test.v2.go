// lexcode-expect: 4
package vault

import (
	"io"

	"github.com/ProtonMail/go-crypto/openpgp/v2"
	"github.com/cloudflare/circl/hpke"
	"github.com/tink-crypto/tink-go/v2/aead"
	"github.com/tink-crypto/tink-go/v2/keyset"
)

// The version 2 OpenPGP API and the tink-go successor module.
func ToRecipient(to []*openpgp.Entity, w io.Writer) (io.WriteCloser, error) {
	return openpgp.Encrypt(w, to, nil, nil, nil, nil)
}

func Seal(handle *keyset.Handle, msg []byte) ([]byte, error) {
	a, err := aead.New(handle)
	if err != nil {
		return nil, err
	}
	return a.Encrypt(msg, nil)
}

// HPKE: a sender and a receiver.
func Sender(suite hpke.Suite, pk hpke.KemPublicKey, info []byte) (*hpke.Sender, error) {
	return suite.NewSender(pk, info)
}

func Receiver(suite hpke.Suite, sk hpke.KemPrivateKey, info []byte) (*hpke.Receiver, error) {
	return suite.NewReceiver(sk, info)
}
