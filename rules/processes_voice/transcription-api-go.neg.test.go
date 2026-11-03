// lexcode-expect: 0
// Chat completion, speech synthesis and a local Transcribe method on our own type.
package notes

import (
	"context"
	"strings"

	"github.com/openai/openai-go"
)

func Summarize(ctx context.Context, client openai.Client, text string) (string, error) {
	reply, err := client.Chat.Completions.New(ctx, openai.ChatCompletionNewParams{
		Model: openai.ChatModelGPT4oMini,
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.UserMessage("Summarize: " + text),
		},
	})
	if err != nil {
		return "", err
	}
	return reply.Choices[0].Message.Content, nil
}

func Speak(ctx context.Context, client openai.Client, text string) error {
	_, err := client.Audio.Speech.New(ctx, openai.AudioSpeechNewParams{
		Model: openai.SpeechModelTTS1,
		Input: text,
		Voice: openai.AudioSpeechNewParamsVoiceAlloy,
	})
	return err
}

type Ledger struct{ rows []string }

func (l *Ledger) Transcribe(prefix string) []string {
	out := make([]string, 0, len(l.rows))
	for _, row := range l.rows {
		out = append(out, strings.TrimSpace(prefix+row))
	}
	return out
}
