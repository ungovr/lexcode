// lexcode-expect: 2
package identity

import (
	"bytes"
	"net/http"
)

// CreateInquiry starts a Persona inquiry for the person's account.
func CreateInquiry(body []byte, key string) (*http.Response, error) {
	req, err := http.NewRequest("POST", "https://withpersona.com/api/v1/inquiries", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+key)
	return http.DefaultClient.Do(req)
}

func JumioStatus(id string) (*http.Response, error) {
	return http.Get("https://netverify.com/api/netverify/v2/scans/" + id)
}
