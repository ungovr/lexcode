// lexcode-expect: 0
package login

import (
	"net/http"

	"github.com/markbates/goth/gothic"
	"golang.org/x/crypto/bcrypt"
)

// Social sign-in through goth.
func Begin(w http.ResponseWriter, r *http.Request) {
	gothic.BeginAuthHandler(w, r)
}

// A password check.
func CheckPassword(hash []byte, password string) bool {
	return bcrypt.CompareHashAndPassword(hash, []byte(password)) == nil
}

type Credential struct{ Name string }

func ParseCredential(raw []byte) *Credential { return &Credential{Name: string(raw)} }

// A function of the app's own that shares a name with a library's.
func Use(raw []byte) *Credential { return ParseCredential(raw) }

type Sessions struct{}

func (s Sessions) New(user string) string { return "session-" + user }

func Open(s Sessions) string { return s.New("a") }
