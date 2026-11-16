// lexcode-expect: 7
package vault

import (
	"bytes"
	"io"

	"github.com/ProtonMail/go-crypto/openpgp"
	"github.com/cloudflare/circl/dh/x25519"
	"github.com/cloudflare/circl/kem/schemes"
	"github.com/google/tink/go/aead"
	"github.com/google/tink/go/hybrid"
	"github.com/google/tink/go/keyset"
)

// OpenPGP encryption to a recipient, and with a passphrase.
func ToRecipient(to openpgp.EntityList, w io.Writer) (io.WriteCloser, error) {
	return openpgp.Encrypt(w, to, nil, nil, nil)
}

func WithPassphrase(pass []byte) (io.WriteCloser, error) {
	var buf bytes.Buffer
	return openpgp.SymmetricallyEncrypt(&buf, pass, nil, nil)
}

// Tink's AEAD and hybrid encryption primitives.
func Seal(handle *keyset.Handle, msg []byte) ([]byte, error) {
	a, err := aead.New(handle)
	if err != nil {
		return nil, err
	}
	return a.Encrypt(msg, nil)
}

func SealFor(handle *keyset.Handle, msg []byte) ([]byte, error) {
	enc, err := hybrid.NewHybridEncrypt(handle)
	if err != nil {
		return nil, err
	}
	return enc.Encrypt(msg, nil)
}

// CIRCL key agreement and a KEM's encapsulation.
func Agree(shared, secret, peer *x25519.Key) bool {
	return x25519.Shared(shared, secret, peer)
}

func Encap(name string, pkBytes []byte) ([]byte, []byte, error) {
	scheme := schemes.ByName(name)
	pk, err := scheme.UnmarshalBinaryPublicKey(pkBytes)
	if err != nil {
		return nil, nil, err
	}
	ct, ss, err := scheme.Encapsulate(pk)
	return ct, ss, err
}

func EncapAgain(name string, pkBytes []byte) ([]byte, []byte, error) {
	s := schemes.ByName(name)
	pk, _ := s.UnmarshalBinaryPublicKey(pkBytes)
	return s.Encapsulate(pk)
}
