<?php
// lexcode-expect: 8
// Recognizing people with Amazon Rekognition from PHP (aws/aws-sdk-php): index a face into a
// collection, search a collection by photo and by stored face, compare two photos, search for
// a user, and a face search over a stored video. The client is imported under an alias; a call
// whose request is built elsewhere counts through that import.
namespace App\Identity;

use Aws\Rekognition\RekognitionClient as Rekognition;

class FaceDirectory
{
    public function __construct(private Rekognition $rekognition)
    {
    }

    public function enroll(string $collection, string $bytes, string $personId): array
    {
        return $this->rekognition->indexFaces([
            'CollectionId' => $collection,
            'Image' => ['Bytes' => $bytes],
            'ExternalImageId' => $personId,
        ])->toArray();
    }

    public function identify(string $collection, string $bytes, string $faceId): array
    {
        $byPhoto = $this->rekognition->searchFacesByImage(['CollectionId' => $collection, 'Image' => ['Bytes' => $bytes]]);
        $byFace = $this->rekognition->searchFaces(['CollectionId' => $collection, 'FaceId' => $faceId]);
        $user = $this->rekognition->searchUsersByImage(['CollectionId' => $collection, 'Image' => ['Bytes' => $bytes]]);
        return [$byPhoto['FaceMatches'], $byFace['FaceMatches'], $user['UserMatches']];
    }

    public function sameperson(string $id, string $selfie): bool
    {
        $result = $this->rekognition->compareFacesAsync([
            'SourceImage' => ['Bytes' => $id],
            'TargetImage' => ['Bytes' => $selfie],
            'SimilarityThreshold' => 90,
        ])->wait();
        return count($result['FaceMatches']) > 0;
    }

    public function searchVideo(array $request): string
    {
        $this->rekognition->searchUsers($request);
        return $this->rekognition->startFaceSearch($request)['JobId'];
    }

    public function viaSdk(\Aws\Sdk $sdk, string $collection, string $bytes): array
    {
        return $sdk->createRekognition()->searchFacesByImage(['CollectionId' => $collection, 'Image' => ['Bytes' => $bytes]])->toArray();
    }
}
