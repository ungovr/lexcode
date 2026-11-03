// lexcode-expect: 1
// Sending a notetaker bot into a video meeting through a meeting-bot API.
package meetings

import (
	"bytes"
	"encoding/json"
	"net/http"
	"os"
)

const recallBase = "https://eu-central-1.recall.ai/api/v1"

func SendNotetaker(meetingURL string) (*http.Response, error) {
	body, err := json.Marshal(map[string]string{"meeting_url": meetingURL, "bot_name": "Notes"})
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequest(http.MethodPost, recallBase+"/bot/", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Token "+os.Getenv("RECALL_API_KEY"))
	return http.DefaultClient.Do(req)
}
