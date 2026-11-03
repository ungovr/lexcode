// lexcode-expect: 2
package main

import (
	"bufio"
	"context"
	"fmt"
	"os"

	openai "github.com/sashabaranov/go-openai"
)

// terminalChat keeps every user turn and every model turn in one slice and sends the
// whole slice back each time.
func terminalChat(client *openai.Client) {
	messages := []openai.ChatCompletionMessage{
		{Role: openai.ChatMessageRoleSystem, Content: "You are a helpful assistant."},
	}
	scanner := bufio.NewScanner(os.Stdin)
	for {
		fmt.Print("you> ")
		if !scanner.Scan() {
			return
		}
		messages = append(messages, openai.ChatCompletionMessage{
			Role:    openai.ChatMessageRoleUser,
			Content: scanner.Text(),
		})
		resp, err := client.CreateChatCompletion(context.Background(), openai.ChatCompletionRequest{
			Model:    openai.GPT4oMini,
			Messages: messages,
		})
		if err != nil {
			fmt.Println("error:", err)
			continue
		}
		fmt.Println("bot>", resp.Choices[0].Message.Content)
		messages = append(messages, resp.Choices[0].Message)
	}
}

// Session holds one visitor's conversation on the server.
type Session struct {
	client *openai.Client
	turns  []openai.ChatCompletionMessage
}

func (s *Session) Say(ctx context.Context, text string) (string, error) {
	s.turns = append(s.turns, openai.ChatCompletionMessage{Role: openai.ChatMessageRoleUser, Content: text})
	var resp openai.ChatCompletionResponse
	var err error
	resp, err = s.client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{Model: openai.GPT4oMini, Messages: s.turns})
	if err != nil {
		return "", err
	}
	reply := resp.Choices[0].Message
	s.turns = append(s.turns, openai.ChatCompletionMessage{Role: openai.ChatMessageRoleAssistant, Content: reply.Content})
	return reply.Content, nil
}
