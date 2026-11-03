// lexcode-expect: 0
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	openai "github.com/sashabaranov/go-openai"
)

var client = openai.NewClient(os.Getenv("OPENAI_API_KEY"))

// A command a maintainer runs: the model's text goes to the terminal and a local file.
func main() {
	resp, err := client.CreateChatCompletion(context.Background(), openai.ChatCompletionRequest{
		Model: openai.GPT4oMini,
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleUser, Content: "Summarize this week's open issues for the maintainers."},
		},
	})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(resp.Choices[0].Message.Content)
	fmt.Fprintln(os.Stderr, resp.Choices[0].Message.Content)
	if err := os.WriteFile("scripts/out/digest.md", []byte(resp.Choices[0].Message.Content), 0o644); err != nil {
		log.Fatal(err)
	}
}

// A handler that calls no model.
func healthHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "ok")
}
