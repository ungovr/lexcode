// lexcode-expect: 5
package vault

import (
	"crypto/rand"

	"golang.org/x/crypto/chacha20poly1305"
	"golang.org/x/crypto/curve25519"
	"golang.org/x/crypto/nacl/box"
	"golang.org/x/crypto/nacl/secretbox"
)

func SealSecret(key *[32]byte, msg []byte) []byte {
	var nonce [24]byte
	_, _ = rand.Read(nonce[:])
	return secretbox.Seal(nonce[:], msg, &nonce, key)
}

func SealForPeer(msg []byte, nonce *[24]byte, peer, mine *[32]byte) []byte {
	return box.Seal(nil, msg, nonce, peer, mine)
}

func Stream(key, nonce, msg []byte) ([]byte, error) {
	aead, err := chacha20poly1305.New(key)
	if err != nil {
		return nil, err
	}
	return aead.Seal(nil, nonce, msg, nil), nil
}

func Agree(secret, peer []byte) ([]byte, error) {
	return curve25519.X25519(secret, peer)
}

func Wrap(key, nonce, msg []byte) ([]byte, error) {
	aead, err := chacha20poly1305.NewX(key)
	if err != nil {
		return nil, err
	}
	return aead.Seal(nil, nonce, msg, nil), nil
}
