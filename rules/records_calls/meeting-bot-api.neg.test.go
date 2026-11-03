// lexcode-expect: 0
// Scheduling a meeting. No bot joins and nothing is recorded.
package meetings

import (
	"bytes"
	"net/http"
)

func ScheduleMeeting(token string, payload []byte) (*http.Response, error) {
	req, err := http.NewRequest(http.MethodPost, "https://api.zoom.us/v2/users/me/meetings", bytes.NewReader(payload))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	return http.DefaultClient.Do(req)
}

const helpNote = "Recall your password by email."
