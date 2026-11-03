// lexcode-expect: 0
package vault

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"net/http"
)

// The standard library's crypto packages are the platform's own.
func SealStd(key, msg []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return nil, err
	}
	return gcm.Seal(nonce, nonce, msg, nil), nil
}

func Sum(msg []byte) [32]byte {
	return sha256.Sum256(msg)
}

// Stock HTTPS through net/http.
func Get(url string) (*http.Response, error) {
	return http.Get(url)
}

type Bag struct{}

func (b Bag) Seal(msg []byte) []byte { return msg }

func Use(b Bag) []byte { return b.Seal([]byte("x")) }
