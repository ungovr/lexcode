// lexcode-expect: 0
package main

import (
	"log"
	"net/http"
	"net/smtp"
	"os"
	"time"

	"github.com/robfig/cron/v3"
)

// A ticker that only refreshes a cache.
func refresh(load func()) {
	ticker := time.NewTicker(5 * time.Minute)
	for range ticker.C {
		load()
	}
}

// A cron job that sends nothing to anyone.
func purge(db interface{ DeleteExpired() error }) {
	c := cron.New()
	c.AddFunc("0 3 * * *", func() {
		if err := db.DeleteExpired(); err != nil {
			log.Println(err)
		}
	})
	c.Start()
}

// Mail sent from a request handler, in reply to the form the person just submitted.
func contactHandler(w http.ResponseWriter, r *http.Request) {
	auth := smtp.PlainAuth("", "hi@example.org", os.Getenv("SMTP_PASS"), "smtp.example.org")
	to := r.FormValue("email")
	msg := []byte("Subject: We got your message\r\n\r\nThanks for writing.\r\n")
	if err := smtp.SendMail("smtp.example.org:587", auth, "hi@example.org", []string{to}, msg); err != nil {
		http.Error(w, "try again", http.StatusBadGateway)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
