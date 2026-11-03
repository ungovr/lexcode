// lexcode-expect: 0
package track

import (
	"log"
	"net/http"
)

// A first-party session cookie and a CSRF cookie.
func Login(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{Name: "session", Value: "token", HttpOnly: true, Secure: true, MaxAge: 3600})
	http.SetCookie(w, &http.Cookie{Name: "csrf_token", Value: "abc", HttpOnly: false, SameSite: http.SameSiteStrictMode})
}

func Theme(w http.ResponseWriter, theme string) {
	http.SetCookie(w, &http.Cookie{Name: "theme", Value: theme, MaxAge: 31536000})
}

// Server-side error logging.
func Fail(err error, path string) {
	log.Printf("request failed on %s: %v", path, err)
}

type Queue struct{ items []string }

func (q *Queue) Enqueue(item string) { q.items = append(q.items, item) }

func Work(q *Queue) { q.Enqueue("job-1") }
