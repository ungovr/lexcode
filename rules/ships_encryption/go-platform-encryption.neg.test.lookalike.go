// lexcode-expect: 0
package shop

import (
	"crypto/cipher"

	"example.com/shop/handshake"
)

// A crypto/cipher mode in a file that imports no block cipher (the block comes from a caller, and
// that cipher's own rule reads it), and the app's own ECDH method in a file that does not import
// crypto/ecdh.
func Stream(block cipher.Block, iv, msg []byte) {
	cipher.NewCTR(block, iv).XORKeyStream(msg, msg)
}

type Session struct{}

func (s Session) ECDH(peer []byte) []byte { return peer }

func Greet(s Session, h handshake.Peer) []byte {
	return s.ECDH(h.Bytes())
}

// The app's own Encapsulate and Decapsulate (a message envelope), in a file that does not import
// crypto/mlkem.
type Envelope struct{}

func (e Envelope) Encapsulate() ([]byte, []byte) { return nil, nil }

func (e Envelope) Decapsulate(b []byte) []byte { return b }

func Wrap(e Envelope) []byte {
	a, _ := e.Encapsulate()
	return e.Decapsulate(a)
}
