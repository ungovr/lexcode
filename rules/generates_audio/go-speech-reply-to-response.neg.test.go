// lexcode-expect: 0
package main

import (
	"context"
	"io"
	"log"
	"net/http"
	"os"

	goopenai "github.com/sashabaranov/go-openai"
)

var client = goopenai.NewClient(os.Getenv("OPENAI_API_KEY"))

// A command an operator runs; the greeting goes to a local file.
func main() {
	speech, err := client.CreateSpeech(context.Background(), goopenai.CreateSpeechRequest{
		Model: goopenai.TTSModel1,
		Input: "You have reached the front desk. Please leave a message.",
		Voice: goopenai.VoiceAlloy,
	})
	if err != nil {
		log.Fatal(err)
	}
	out, err := os.Create("scripts/out/greeting.mp3")
	if err != nil {
		log.Fatal(err)
	}
	defer out.Close()
	if _, err := io.Copy(out, speech); err != nil {
		log.Fatal(err)
	}
}

// A person's own recording that the server only plays.
func recordingHandler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "recordings/"+r.PathValue("id")+".mp3")
}
