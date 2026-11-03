// lexcode-expect: 4
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	openai "github.com/sashabaranov/go-openai"
)

var client = openai.NewClient("sk-placeholder")

// summarizeHandler writes the model's summary into the HTTP response.
func summarizeHandler(w http.ResponseWriter, r *http.Request) {
	resp, err := client.CreateChatCompletion(r.Context(), openai.ChatCompletionRequest{
		Model: openai.GPT4oMini,
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleUser, Content: "Summarize: " + r.FormValue("text")},
		},
	})
	if err != nil {
		http.Error(w, "upstream error", http.StatusBadGateway)
		return
	}
	fmt.Fprint(w, resp.Choices[0].Message.Content)
}

// headlineHandler encodes the model's text as JSON for the caller.
func headlineHandler(w http.ResponseWriter, r *http.Request) {
	resp, err := client.CreateChatCompletion(r.Context(), openai.ChatCompletionRequest{
		Model: openai.GPT4oMini,
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleUser, Content: "Write a headline about " + r.URL.Query().Get("topic")},
		},
	})
	if err != nil {
		return
	}
	_ = json.NewEncoder(w).Encode(map[string]string{"headline": resp.Choices[0].Message.Content})
}

// ginHandler is the same thing in Gin.
func ginHandler(c *gin.Context) {
	resp, err := client.CreateChatCompletion(c, openai.ChatCompletionRequest{
		Model: openai.GPT4oMini,
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleUser, Content: c.Query("q")},
		},
	})
	if err != nil {
		c.Status(http.StatusBadGateway)
		return
	}
	c.JSON(http.StatusOK, gin.H{"answer": resp.Choices[0].Message.Content})
}

// closure handler registered inline.
func register(mux *http.ServeMux) {
	mux.HandleFunc("/tagline", func(w http.ResponseWriter, r *http.Request) {
		resp, _ := client.CreateChatCompletion(context.Background(), openai.ChatCompletionRequest{
			Model:    openai.GPT4oMini,
			Messages: []openai.ChatCompletionMessage{{Role: openai.ChatMessageRoleUser, Content: "Write a tagline."}},
		})
		w.Write([]byte(resp.Choices[0].Message.Content))
	})
}
