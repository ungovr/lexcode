// lexcode-expect: 0
package main

import (
	"context"
	"fmt"
	"log"
	"os"

	goopenai "github.com/sashabaranov/go-openai"
)

var client = goopenai.NewClient(os.Getenv("OPENAI_API_KEY"))

// Calling somebody else's model, and listing the fine-tuning jobs that already exist, is not training.
func main() {
	resp, err := client.CreateChatCompletion(context.Background(), goopenai.ChatCompletionRequest{
		Model:    goopenai.GPT4oMini,
		Messages: []goopenai.ChatCompletionMessage{{Role: goopenai.ChatMessageRoleUser, Content: "Hello"}},
	})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(resp.Choices[0].Message.Content)

	jobs, err := client.ListFineTuningJobs(context.Background())
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(len(jobs.Data), "existing jobs")
}

type Trainer struct{ dogs []string }

// Train teaches a dog a command; there is no model in sight.
func (t *Trainer) Train(dog, command string) string {
	return dog + " learns " + command
}
