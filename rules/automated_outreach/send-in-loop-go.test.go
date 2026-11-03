// lexcode-expect: 3
package main

import (
	"net/smtp"
	"os"

	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
	"github.com/twilio/twilio-go"
	openapi "github.com/twilio/twilio-go/rest/api/v2010"
)

type subscriber struct {
	Email string
	Phone string
}

func weekly(subs []subscriber, msg []byte) error {
	auth := smtp.PlainAuth("", "weekly@example.org", os.Getenv("SMTP_PASS"), "smtp.example.org")
	for _, s := range subs {
		if err := smtp.SendMail("smtp.example.org:587", auth, "weekly@example.org", []string{s.Email}, msg); err != nil {
			return err
		}
	}
	return nil
}

func textAll(subs []subscriber) {
	client := twilio.NewRestClient()
	for _, s := range subs {
		params := &openapi.CreateMessageParams{}
		params.SetTo(s.Phone)
		params.SetBody("Your trash pickup moves to Tuesday.")
		client.Api.CreateMessage(params)
	}
}

func viaSendgrid(subs []subscriber) {
	sg := sendgrid.NewSendClient(os.Getenv("SENDGRID_API_KEY"))
	for _, s := range subs {
		m := mail.NewSingleEmail(mail.NewEmail("News", "news@example.org"), "Update", mail.NewEmail("", s.Email), "Something changed.", "")
		sg.Send(m)
	}
}
