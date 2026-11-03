// lexcode-expect: 0
// Rekognition used for labels and moderation, and an unrelated type with a
// CompareFaces-like name that takes no image.
package faces

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/service/rekognition"
	"github.com/aws/aws-sdk-go-v2/service/rekognition/types"
)

func Labels(ctx context.Context, client *rekognition.Client, image []byte) ([]string, error) {
	out, err := client.DetectLabels(ctx, &rekognition.DetectLabelsInput{Image: &types.Image{Bytes: image}})
	if err != nil {
		return nil, err
	}
	names := make([]string, 0, len(out.Labels))
	for _, label := range out.Labels {
		names = append(names, *label.Name)
	}
	return names, nil
}

func Moderate(ctx context.Context, client *rekognition.Client, image []byte) (int, error) {
	out, err := client.DetectModerationLabels(ctx, &rekognition.DetectModerationLabelsInput{Image: &types.Image{Bytes: image}})
	if err != nil {
		return 0, err
	}
	return len(out.ModerationLabels), nil
}

type Roster struct{ names []string }

func (r *Roster) Names() []string { return r.names }
