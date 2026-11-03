// lexcode-expect: 3
package track

import (
	"net/http"

	"github.com/posthog/posthog-go"
	"github.com/segmentio/analytics-go/v3"
)

var segment = analytics.New("segment-write-key")
var ph, _ = posthog.NewWithConfig("phc_example", posthog.Config{})

// Gives each first-time visitor a long-lived id.
func VisitorCookie(w http.ResponseWriter, r *http.Request) {
	if _, err := r.Cookie("visitor_id"); err != nil {
		http.SetCookie(w, &http.Cookie{Name: "visitor_id", Value: "v-123", MaxAge: 63072000, Path: "/"})
	}
}

func Signup(userID string) error {
	if err := segment.Enqueue(analytics.Track{UserId: userID, Event: "Signed up"}); err != nil {
		return err
	}
	return ph.Enqueue(posthog.Capture{DistinctId: userID, Event: "signed_up"})
}
