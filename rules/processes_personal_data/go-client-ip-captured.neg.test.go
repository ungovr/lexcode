// lexcode-expect: 0
package web

import (
	"log"
	"net/http"
	"sync"
)

var (
	mu   sync.Mutex
	hits = map[string]int{}
)

// An in-memory rate-limit key that is never written anywhere.
func Limit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		hits[r.RemoteAddr]++
		over := hits[r.RemoteAddr] > 100
		mu.Unlock()
		if over {
			http.Error(w, "slow down", http.StatusTooManyRequests)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// Logging without the address.
func Health(w http.ResponseWriter, r *http.Request) {
	log.Printf("health check on %s", r.URL.Path)
	w.WriteHeader(http.StatusNoContent)
}

// The forwarded protocol is not the person's address.
func Scheme(r *http.Request) string {
	proto := r.Header.Get("X-Forwarded-Proto")
	log.Printf("proto %s", proto)
	return proto
}

func Listen() {
	log.Printf("listening on %s", "0.0.0.0:8080")
}
