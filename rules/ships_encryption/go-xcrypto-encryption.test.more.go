// lexcode-expect: 11
package transfer

import (
	"bytes"
	"io"
	"net"

	"golang.org/x/crypto/blowfish"
	"golang.org/x/crypto/chacha20"
	"golang.org/x/crypto/nacl/box"
	"golang.org/x/crypto/openpgp"
	"golang.org/x/crypto/salsa20"
	"golang.org/x/crypto/ssh"
	"golang.org/x/crypto/twofish"
	"golang.org/x/crypto/xts"
)

func OpenFromPeer(sealed []byte, nonce *[24]byte, peer, mine *[32]byte) ([]byte, bool) {
	return box.Open(nil, sealed, nonce, peer, mine) // 1
}

func Shared(peer, mine *[32]byte) *[32]byte {
	var shared [32]byte
	box.Precompute(&shared, peer, mine) // 2
	return &shared
}

func Stream(key, nonce, msg []byte) error {
	c, err := chacha20.NewUnauthenticatedCipher(key, nonce) // 3
	if err != nil {
		return err
	}
	c.XORKeyStream(msg, msg)
	return nil
}

func Salsa(key *[32]byte, nonce, msg []byte) {
	salsa20.XORKeyStream(msg, msg, nonce, key) // 4
}

func Disk(key []byte) (*xts.Cipher, error) {
	return xts.NewCipher(twofish.NewCipher, key) // 5
}

func Blocks(key []byte) {
	_, _ = blowfish.NewCipher(key) // 6
	_, _ = twofish.NewCipher(      // 7
		key,
	)
}

func Pgp(to []*openpgp.Entity, msg []byte) error {
	var out bytes.Buffer
	w, err := openpgp.Encrypt(&out, to, nil, nil, nil) // 8
	if err != nil {
		return err
	}
	_, err = io.Copy(w, bytes.NewReader(msg))
	return err
}

func Remote(addr string, cfg *ssh.ClientConfig) (*ssh.Client, error) {
	return ssh.Dial("tcp", addr, cfg) // 9
}

func Serve(conn net.Conn, cfg *ssh.ServerConfig) error {
	_, _, _, err := ssh.NewServerConn(conn, cfg) // 10
	return err
}

func Over(conn net.Conn, addr string, cfg *ssh.ClientConfig) error {
	_, _, _, err := ssh.NewClientConn(conn, addr, cfg) // 11
	return err
}
