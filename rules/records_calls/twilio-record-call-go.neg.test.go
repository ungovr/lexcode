// lexcode-expect: 0
// A call placed with no recording, and an unrelated setter that takes true.
package calls

import (
	"github.com/twilio/twilio-go"
	api "github.com/twilio/twilio-go/rest/api/v2010"
)

type Flags struct{ verbose bool }

func (f *Flags) SetVerbose(on bool) { f.verbose = on }

func PlaceCall(to, from, url string) error {
	client := twilio.NewRestClient()
	params := &api.CreateCallParams{}
	params.SetTo(to)
	params.SetFrom(from)
	params.SetUrl(url)
	params.SetRecord(false)
	_, err := client.Api.CreateCall(params)
	return err
}

func Configure() *Flags {
	flags := &Flags{}
	flags.SetVerbose(true)
	return flags
}
