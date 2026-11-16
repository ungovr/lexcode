// lexcode-expect: 3
package vault

import (
	"github.com/cloudflare/circl/kem"
	"github.com/cloudflare/circl/kem/frodo/frodo640shake"
	"github.com/cloudflare/circl/kem/hybrid"
)

// CIRCL's hybrid X25519+Kyber KEM and FrodoKEM: encapsulating to a peer, and decapsulating (#13336).
func Hybrid(pk kem.PublicKey) ([]byte, []byte, error) {
	return hybrid.Kyber768X25519().Encapsulate(pk)
}

func Frodo(pk kem.PublicKey) ([]byte, []byte, error) {
	return frodo640shake.Scheme().Encapsulate(pk)
}

func Open(sk kem.PrivateKey, ct []byte) ([]byte, error) {
	return hybrid.Kyber768X25519().Decapsulate(sk, ct)
}
