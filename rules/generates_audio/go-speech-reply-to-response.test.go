// lexcode-expect: 3
package main

import (
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/openai/openai-go"
	goopenai "github.com/sashabaranov/go-openai"
)

var legacy = goopenai.NewClient("sk-placeholder")
var modern = openai.NewClient()

// narrateHandler streams the synthesized narration to the visitor.
func narrateHandler(w http.ResponseWriter, r *http.Request) {
	speech, err := legacy.CreateSpeech(r.Context(), goopenai.CreateSpeechRequest{
		Model: goopenai.TTSModel1,
		Input: r.FormValue("text"),
		Voice: goopenai.VoiceAlloy,
	})
	if err != nil {
		http.Error(w, "upstream error", http.StatusBadGateway)
		return
	}
	w.Header().Set("Content-Type", "audio/mpeg")
	io.Copy(w, speech)
}

// readAloudHandler does the same with the official SDK, in Gin.
func readAloudHandler(c *gin.Context) {
	speech, err := modern.Audio.Speech.New(c, openai.AudioSpeechNewParams{
		Model: openai.SpeechModelTTS1,
		Input: c.Query("text"),
		Voice: openai.AudioSpeechNewParamsVoiceAlloy,
	})
	if err != nil {
		c.Status(http.StatusBadGateway)
		return
	}
	data, _ := io.ReadAll(speech.Body)
	c.String(http.StatusOK, string(data))
}

// pingHandler writes the audio bytes directly.
func pingHandler(w http.ResponseWriter, r *http.Request) {
	speech, err := modern.Audio.Speech.New(r.Context(), openai.AudioSpeechNewParams{Input: "Ready."})
	if err != nil {
		return
	}
	data, _ := io.ReadAll(speech.Body)
	w.Write(data)
}
