// lexcode-expect: 0
package auth

import (
	"crypto/ecdh"
	"crypto/ecdsa"
	"crypto/ed25519"
	"crypto/hkdf"
	"crypto/hmac"
	"crypto/pbkdf2"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/tls"
	"net/http"
)

// Hashing and a MAC are integrity, not confidentiality.
func Fingerprint(msg []byte) [32]byte {
	return sha256.Sum256(msg)
}

func WebhookSignature(secret, body []byte) []byte {
	mac := hmac.New(sha256.New, secret)
	mac.Write(body)
	return mac.Sum(nil)
}

// Password hashing and key derivation.
func DeriveFromPassword(password string, salt []byte) ([]byte, error) {
	return pbkdf2.Key(sha256.New, password, salt, 600000, 32)
}

func Expand(secret, salt []byte) ([]byte, error) {
	return hkdf.Key(sha256.New, secret, salt, "app", 32)
}

// Signing, with ECDSA, Ed25519 and RSA-PSS.
func Sign(priv *ecdsa.PrivateKey, edPriv ed25519.PrivateKey, rsaPriv *rsa.PrivateKey, digest []byte) {
	_, _ = ecdsa.SignASN1(rand.Reader, priv, digest)
	_ = ed25519.Sign(edPriv, digest)
	_, _ = rsa.SignPSS(rand.Reader, rsaPriv, 0, digest, nil)
}

// An ECDSA key's conversion to its crypto/ecdh form agrees no key.
func Convert(priv *ecdsa.PrivateKey) (*ecdh.PrivateKey, error) {
	return priv.ECDH()
}

// Random bytes.
func Token() []byte {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	return b
}

// Stock HTTPS through net/http, with the standard library's own TLS settings.
func Get(url string) (*http.Response, error) {
	client := &http.Client{Transport: &http.Transport{TLSClientConfig: &tls.Config{MinVersion: tls.VersionTLS12}}}
	return client.Get(url)
}

func Fetch() (*http.Response, error) {
	return http.Get("https://api.example.org/v1/items")
}
