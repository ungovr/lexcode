// lexcode-expect: 15
package vault

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/des"
	"crypto/ecdh"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
)

// AES-GCM from the standard library: a block cipher in an AEAD mode.
func SealStd(key, msg []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	gcm, err := cipher.NewGCM(block) // 1
	if err != nil {
		return nil, err
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return nil, err
	}
	return gcm.Seal(nonce, nonce, msg, nil), nil
}

// The other modes of crypto/cipher.
func Modes(key, iv, msg []byte) {
	block, _ := aes.NewCipher(key)
	cipher.NewCTR(block, iv).XORKeyStream(msg, msg)   // 2
	cipher.NewCBCEncrypter(block, iv).CryptBlocks(msg, msg) // 3
	cipher.NewCBCDecrypter(block, iv).CryptBlocks(msg, msg) // 4
	cipher.NewCFBEncrypter(block, iv).XORKeyStream(msg, msg) // 5
	cipher.NewCFBDecrypter(block, iv).XORKeyStream(msg, msg) // 6
	cipher.NewOFB(block, iv).XORKeyStream(msg, msg)          // 7
	_, _ = cipher.NewGCMWithNonceSize(block, 16)             // 8
}

// Triple DES, in a file that also imports crypto/des.
func Legacy(key, iv, msg []byte) {
	block, _ := des.NewTripleDESCipher(key)
	cipher.NewCBCEncrypter( // 9
		block,
		iv,
	).CryptBlocks(msg, msg)
}

// RSA encryption of a data key, with OAEP and with PKCS #1 v1.5.
func Wrap(pub *rsa.PublicKey, dataKey []byte) ([]byte, error) {
	return rsa.EncryptOAEP(sha256.New(), rand.Reader, pub, dataKey, nil) // 10
}

func Unwrap(priv *rsa.PrivateKey, wrapped []byte) ([]byte, error) {
	return rsa.DecryptOAEP(sha256.New(), rand.Reader, priv, wrapped, nil) // 11
}

func WrapLegacy(pub *rsa.PublicKey, dataKey []byte) ([]byte, error) {
	return rsa.EncryptPKCS1v15(rand.Reader, pub, dataKey) // 12
}

// Key agreement with crypto/ecdh.
func Agree(peer []byte) ([]byte, error) {
	curve := ecdh.X25519() // 13
	mine, err := curve.GenerateKey(rand.Reader)
	if err != nil {
		return nil, err
	}
	theirs, err := curve.NewPublicKey(peer)
	if err != nil {
		return nil, err
	}
	return mine.ECDH(theirs) // 14
}

func AgreeP256() (*ecdh.PrivateKey, error) {
	return ecdh.P256().GenerateKey(rand.Reader) // 15
}
