// lexcode-expect: 0
package auth

import "golang.org/x/crypto/bcrypt"

// An app that imports only golang.org/x/crypto/bcrypt hashes passwords and holds no cipher: Go links
// only the subpackages a program imports. The module golang.org/x/crypto in go.mod is therefore not
// evidence by itself (the component map has no entry for it); this rule reads the cipher subpackages.
func Hash(password string) ([]byte, error) {
	return bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
}

func Check(hash []byte, password string) error {
	return bcrypt.CompareHashAndPassword(hash, []byte(password))
}
