// lexcode-expect: 0
package main

import (
	"context"
	"encoding/json"
	"net/http"

	openai "github.com/sashabaranov/go-openai"
)

var client = openai.NewClient("sk-placeholder")

type summarizeRequest struct {
	Text string `json:"text"`
}

// summarizeHandler: one text in, one summary out, nothing remembered.
func summarizeHandler(w http.ResponseWriter, r *http.Request) {
	var body summarizeRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	resp, err := client.CreateChatCompletion(r.Context(), openai.ChatCompletionRequest{
		Model: openai.GPT4oMini,
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleSystem, Content: "Summarize the text in one paragraph."},
			{Role: openai.ChatMessageRoleUser, Content: body.Text},
		},
	})
	if err != nil {
		http.Error(w, "upstream error", http.StatusBadGateway)
		return
	}
	_ = json.NewEncoder(w).Encode(map[string]string{"summary": resp.Choices[0].Message.Content})
}

// labelAll is a batch job: each document gets its own call, and no reply is fed back.
func labelAll(ctx context.Context, docs []string) ([]string, error) {
	labels := make([]string, 0, len(docs))
	for _, doc := range docs {
		messages := []openai.ChatCompletionMessage{}
		messages = append(messages, openai.ChatCompletionMessage{Role: openai.ChatMessageRoleUser, Content: "One word label for: " + doc})
		resp, err := client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{Model: openai.GPT4oMini, Messages: messages})
		if err != nil {
			return nil, err
		}
		labels = append(labels, resp.Choices[0].Message.Content)
	}
	return labels, nil
}
