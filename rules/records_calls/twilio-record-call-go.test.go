// lexcode-expect: 1
// Placing a call with the Twilio Go helper library and turning recording on.
package calls

import (
	"os"

	"github.com/twilio/twilio-go"
	api "github.com/twilio/twilio-go/rest/api/v2010"
)

func PlaceRecordedCall(to, from, url string) error {
	client := twilio.NewRestClient()
	params := &api.CreateCallParams{}
	params.SetTo(to)
	params.SetFrom(from)
	params.SetUrl(url)
	params.SetRecord(true)
	params.SetRecordingChannels("dual")
	_, err := client.Api.CreateCall(params)
	if err != nil {
		os.Stderr.WriteString(err.Error())
	}
	return err
}
