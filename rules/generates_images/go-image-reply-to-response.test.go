// lexcode-expect: 3
package main

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/openai/openai-go"
	goopenai "github.com/sashabaranov/go-openai"
)

var legacy = goopenai.NewClient("sk-placeholder")
var modern = openai.NewClient()

// avatarHandler returns the picture the model draws.
func avatarHandler(w http.ResponseWriter, r *http.Request) {
	resp, err := legacy.CreateImage(r.Context(), goopenai.ImageRequest{
		Prompt:         "Avatar of " + r.FormValue("name"),
		Size:           goopenai.CreateImageSize1024x1024,
		ResponseFormat: goopenai.CreateImageResponseFormatB64JSON,
	})
	if err != nil {
		http.Error(w, "upstream error", http.StatusBadGateway)
		return
	}
	w.Write([]byte(resp.Data[0].B64JSON))
}

// posterHandler does the same with the official SDK, in Gin.
func posterHandler(c *gin.Context) {
	img, err := modern.Images.Generate(context.Background(), openai.ImageGenerateParams{
		Prompt: c.Query("theme"),
		Model:  openai.ImageModelGPTImage1,
	})
	if err != nil {
		c.Status(http.StatusBadGateway)
		return
	}
	c.JSON(http.StatusOK, gin.H{"image": img.Data[0].B64JSON})
}

// coverHandler encodes the result as JSON.
func coverHandler(w http.ResponseWriter, r *http.Request) {
	img, err := modern.Images.Generate(r.Context(), openai.ImageGenerateParams{Prompt: "Book cover"})
	if err != nil {
		return
	}
	_ = json.NewEncoder(w).Encode(map[string]string{"image": img.Data[0].B64JSON})
}
