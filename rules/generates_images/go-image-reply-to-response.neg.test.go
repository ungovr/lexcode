// lexcode-expect: 0
package main

import (
	"context"
	"encoding/base64"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"log"
	"net/http"
	"os"

	goopenai "github.com/sashabaranov/go-openai"
)

var client = goopenai.NewClient(os.Getenv("OPENAI_API_KEY"))

// A command a designer runs once; the picture goes to a local file.
func main() {
	resp, err := client.CreateImage(context.Background(), goopenai.ImageRequest{
		Prompt:         "Soft watercolor skyline, no text",
		ResponseFormat: goopenai.CreateImageResponseFormatB64JSON,
	})
	if err != nil {
		log.Fatal(err)
	}
	raw, _ := base64.StdEncoding.DecodeString(resp.Data[0].B64JSON)
	if err := os.WriteFile("scripts/out/hero-draft.png", raw, 0o644); err != nil {
		log.Fatal(err)
	}
	fmt.Println("wrote draft, bytes:", len(raw))
}

// A handler that draws a solid swatch with the standard library, no model involved.
func swatchHandler(w http.ResponseWriter, r *http.Request) {
	img := image.NewRGBA(image.Rect(0, 0, 64, 64))
	for x := 0; x < 64; x++ {
		for y := 0; y < 64; y++ {
			img.Set(x, y, color.RGBA{R: 11, G: 61, B: 92, A: 255})
		}
	}
	w.Header().Set("Content-Type", "image/png")
	png.Encode(w, img)
}
