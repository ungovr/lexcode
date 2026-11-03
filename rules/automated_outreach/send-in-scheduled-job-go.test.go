// lexcode-expect: 3
package main

import (
	"net/smtp"
	"os"
	"time"

	"github.com/robfig/cron/v3"
	"github.com/twilio/twilio-go"
	openapi "github.com/twilio/twilio-go/rest/api/v2010"
)

func digestLoop(msg []byte) {
	auth := smtp.PlainAuth("", "digest@example.org", os.Getenv("SMTP_PASS"), "smtp.example.org")
	ticker := time.NewTicker(24 * time.Hour)
	for range ticker.C {
		smtp.SendMail("smtp.example.org:587", auth, "digest@example.org", []string{"list@example.org"}, msg)
	}
}

func reminders() {
	client := twilio.NewRestClient()
	c := cron.New()
	c.AddFunc("0 18 * * *", func() {
		params := &openapi.CreateMessageParams{}
		params.SetTo("+15550101")
		params.SetBody("Reminder: your appointment is tomorrow.")
		client.Api.CreateMessage(params)
	})
	c.Start()
}

func alerts(msg []byte) {
	ticker := time.NewTicker(time.Minute)
	done := make(chan bool)
	for {
		select {
		case <-done:
			return
		case <-ticker.C:
			smtp.SendMail("smtp.example.org:587", nil, "alerts@example.org", []string{"ops@example.org"}, msg)
		}
	}
}
