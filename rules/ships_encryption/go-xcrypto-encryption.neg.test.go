// lexcode-expect: 0
package vault

import (
	"crypto/sha256"
	"net/http"

	"example.com/shop/box"
	"golang.org/x/crypto/argon2"
	"golang.org/x/crypto/blake2b"
	"golang.org/x/crypto/ed25519"
	"golang.org/x/crypto/hkdf"
	"golang.org/x/crypto/nacl/auth"
	"golang.org/x/crypto/nacl/sign"
	"golang.org/x/crypto/pbkdf2"
	"golang.org/x/crypto/scrypt"
	"golang.org/x/crypto/sha3"
)

// The subpackages of golang.org/x/crypto that hash, derive keys, authenticate or sign. Go links only
// the subpackages a program imports, so a program that imports only these holds no cipher. (The
// standard library's ciphers are shipping encryption too; go-platform-encryption reads them.)
func Hashes(msg []byte) ([32]byte, [32]byte, [32]byte) {
	return sha256.Sum256(msg), sha3.Sum256(msg), blake2b.Sum256(msg)
}

func Derive(password, salt []byte) ([]byte, []byte, []byte, error) {
	k1 := argon2.IDKey(password, salt, 1, 64*1024, 4, 32)
	k2 := pbkdf2.Key(password, salt, 600000, 32, sha256.New)
	k3, err := scrypt.Key(password, salt, 1<<15, 8, 1, 32)
	return k1, k2, k3, err
}

func Expand(secret, salt []byte) []byte {
	out := make([]byte, 32)
	_, _ = hkdf.New(sha256.New, secret, salt, nil).Read(out)
	return out
}

func Authenticate(msg []byte, key *[32]byte) *[auth.Size]byte {
	return auth.Sum(msg, key)
}

func SignAll(msg []byte, priv ed25519.PrivateKey, signKey *[64]byte) ([]byte, []byte) {
	return ed25519.Sign(priv, msg), sign.Sign(nil, msg, signKey)
}

// Stock HTTPS through net/http.
func Get(url string) (*http.Response, error) {
	return http.Get(url)
}

// The app's own box package and Seal method, with the names of the NaCl ones.
type Bag struct{}

func (b Bag) Seal(msg []byte) []byte { return msg }

func Use(b Bag) []byte { return b.Seal([]byte("x")) }

func Pack(msg []byte) []byte { return box.Seal(nil, msg, nil, nil, nil) }
