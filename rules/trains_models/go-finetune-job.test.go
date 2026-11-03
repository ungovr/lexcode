// lexcode-expect: 2
package main

import (
	"context"

	"github.com/openai/openai-go"
	goopenai "github.com/sashabaranov/go-openai"
)

var legacy = goopenai.NewClient("sk-placeholder")
var modern = openai.NewClient()

// startFineTune submits a hosted fine-tuning job on data the app collected.
func startFineTune(ctx context.Context, fileID string) (string, error) {
	job, err := legacy.CreateFineTuningJob(ctx, goopenai.FineTuningJobRequest{
		TrainingFile: fileID,
		Model:        "gpt-4o-mini-2024-07-18",
	})
	if err != nil {
		return "", err
	}
	return job.ID, nil
}

// startFineTuneModern does the same with the official SDK.
func startFineTuneModern(ctx context.Context, fileID string) (string, error) {
	job, err := modern.FineTuning.Jobs.New(ctx, openai.FineTuningJobNewParams{
		Model:        openai.FineTuningJobNewParamsModelGPT4oMini,
		TrainingFile: fileID,
	})
	if err != nil {
		return "", err
	}
	return job.ID, nil
}
