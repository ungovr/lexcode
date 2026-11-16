// lexcode-expect: 0
package vault

import (
	"crypto"
	"io"

	"github.com/ProtonMail/go-crypto/openpgp"
	"github.com/cloudflare/circl/sign/ed448"
	"github.com/cloudflare/circl/sign/mldsa/mldsa65"
	"github.com/google/tink/go/keyset"
	"github.com/google/tink/go/mac"
	"github.com/google/tink/go/signature"
)

// An app that links these modules only to sign, verify or MAC ships no encryption (#13336).
func Sign(w io.Writer, signer *openpgp.Entity, msg io.Reader) error {
	return openpgp.DetachSign(w, signer, msg, nil)
}

func Verify(keyring openpgp.KeyRing, signed, sig io.Reader) (*openpgp.Entity, error) {
	return openpgp.CheckDetachedSignature(keyring, signed, sig, nil)
}

func Tag(handle *keyset.Handle, msg []byte) ([]byte, error) {
	m, err := mac.New(handle)
	if err != nil {
		return nil, err
	}
	return m.ComputeMAC(msg)
}

func SignTink(handle *keyset.Handle, msg []byte) ([]byte, error) {
	s, err := signature.NewSigner(handle)
	if err != nil {
		return nil, err
	}
	return s.Sign(msg)
}

func SignCircl(priv ed448.PrivateKey, sk *mldsa65.PrivateKey, msg []byte) ([]byte, error) {
	_ = ed448.Sign(priv, msg, "")
	return sk.Sign(nil, msg, crypto.Hash(0))
}

// The app's own types with the same method names, in a file that imports no encrypting package.
type box struct{}

func (box) Encapsulate(b []byte) []byte { return b }
func (box) NewSender(b []byte) []byte   { return b }

var _ = box{}.Encapsulate(nil)
var _ = box{}.NewSender(nil)
