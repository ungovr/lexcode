// lexcode-expect: 4
// Speech-to-text from Go: the OpenAI clients, Google Cloud Speech and AWS Transcribe.
package transcribe

import (
	"context"
	"os"

	speech "cloud.google.com/go/speech/apiv1"
	"cloud.google.com/go/speech/apiv1/speechpb"
	"github.com/aws/aws-sdk-go-v2/service/transcribe"
	"github.com/openai/openai-go"
	goopenai "github.com/sashabaranov/go-openai"
)

func WithOfficialClient(ctx context.Context, client openai.Client, path string) (string, error) {
	file, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer file.Close()
	result, err := client.Audio.Transcriptions.New(ctx, openai.AudioTranscriptionNewParams{
		Model: openai.AudioModelWhisper1,
		File:  file,
	})
	if err != nil {
		return "", err
	}
	return result.Text, nil
}

func WithCommunityClient(ctx context.Context, client *goopenai.Client, path string) (string, error) {
	reply, err := client.CreateTranscription(ctx, goopenai.AudioRequest{
		Model:    goopenai.Whisper1,
		FilePath: path,
	})
	if err != nil {
		return "", err
	}
	return reply.Text, nil
}

func WithGoogle(ctx context.Context, client *speech.Client, content []byte) (*speechpb.RecognizeResponse, error) {
	return client.Recognize(ctx, &speechpb.RecognizeRequest{
		Config: &speechpb.RecognitionConfig{LanguageCode: "en-US"},
		Audio:  &speechpb.RecognitionAudio{AudioSource: &speechpb.RecognitionAudio_Content{Content: content}},
	})
}

func WithAWS(ctx context.Context, client *transcribe.Client, input *transcribe.StartTranscriptionJobInput) error {
	_, err := client.StartTranscriptionJob(ctx, input)
	return err
}
