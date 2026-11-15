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
