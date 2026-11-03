// lexcode-expect: 3
// Matching faces with Amazon Rekognition from Go: index a face, search a
// collection, and compare two photos.
package faces

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/rekognition"
	"github.com/aws/aws-sdk-go-v2/service/rekognition/types"
)

func Enroll(ctx context.Context, client *rekognition.Client, collection string, image []byte, person string) error {
	_, err := client.IndexFaces(ctx, &rekognition.IndexFacesInput{
		CollectionId:    aws.String(collection),
		Image:           &types.Image{Bytes: image},
		ExternalImageId: aws.String(person),
	})
	return err
}

func Find(ctx context.Context, client *rekognition.Client, collection string, image []byte) (*rekognition.SearchFacesByImageOutput, error) {
	return client.SearchFacesByImage(ctx, &rekognition.SearchFacesByImageInput{
		CollectionId: aws.String(collection),
		Image:        &types.Image{Bytes: image},
	})
}

func SamePerson(ctx context.Context, client *rekognition.Client, a, b []byte) (bool, error) {
	out, err := client.CompareFaces(ctx, &rekognition.CompareFacesInput{
		SourceImage: &types.Image{Bytes: a},
		TargetImage: &types.Image{Bytes: b},
	})
	if err != nil {
		return false, err
	}
	return len(out.FaceMatches) > 0, nil
}
