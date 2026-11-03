// lexcode-expect: 0
package main

import (
	"fmt"
	"net/smtp"
	"os"
	"time"
)

// A password reset the person just asked for: one message, in a request handler.
func sendPasswordReset(to, token string) error {
	auth := smtp.PlainAuth("", "login@example.org", os.Getenv("SMTP_PASS"), "smtp.example.org")
	body := fmt.Sprintf("Subject: Reset your password\r\n\r\nhttps://example.org/reset?token=%s\r\n", token)
	return smtp.SendMail("smtp.example.org:587", auth, "login@example.org", []string{to}, []byte(body))
}

// A retry loop around ONE message to ONE person is not a loop over recipients.
func sendWithRetry(to string, msg []byte) error {
	auth := smtp.PlainAuth("", "login@example.org", os.Getenv("SMTP_PASS"), "smtp.example.org")
	var err error
	for attempt := 0; attempt < 3; attempt++ {
		if err = smtp.SendMail("smtp.example.org:587", auth, "login@example.org", []string{to}, msg); err == nil {
			return nil
		}
		time.Sleep(time.Duration(attempt+1) * time.Second)
	}
	return err
}

// A fallback loop over mail relays: ONE message to ONE person, whichever relay accepts it.
func deliverViaFirstRelay(relays []string, to string, msg []byte) (string, error) {
	var last error
	for _, relay := range relays {
		if last = smtp.SendMail(relay+":587", nil, "login@example.org", []string{to}, msg); last == nil {
			return relay, nil
		}
	}
	return "", last
}

// A loop that builds messages and sends nothing.
func build(addresses []string) [][]byte {
	var out [][]byte
	for _, a := range addresses {
		out = append(out, []byte("To: "+a+"\r\n"))
	}
	return out
}
