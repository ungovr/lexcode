// lexcode-expect: 3
package web

import (
	"database/sql"
	"log"
	"log/slog"
	"net/http"
)

var db *sql.DB

// Writes the visitor's address into the access log.
func AccessLog(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("request from %s to %s", r.RemoteAddr, r.URL.Path)
		next.ServeHTTP(w, r)
	})
}

// Stores the forwarded address with each signup.
func Signup(w http.ResponseWriter, r *http.Request) {
	forwarded := r.Header.Get("X-Forwarded-For")
	_, err := db.Exec("INSERT INTO signups (email, ip) VALUES ($1, $2)", r.FormValue("email"), forwarded)
	if err != nil {
		http.Error(w, "failed", http.StatusInternalServerError)
	}
}

func Login(w http.ResponseWriter, r *http.Request) {
	slog.Warn("login attempt", "ip", r.RemoteAddr)
}
