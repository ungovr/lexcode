<?php
// lexcode-expect: 2
// Amazon Rekognition's client written in full with no import, comparing a selfie with an ID
// photo and searching a collection with a request built elsewhere.
namespace App\Kyc;

class SelfieCheck
{
    public function check(string $id, string $selfie, array $search): array
    {
        $client = new \Aws\Rekognition\RekognitionClient(['region' => 'eu-west-1', 'version' => 'latest']);
        $match = $client->compareFaces(['SourceImage' => ['Bytes' => $id], 'TargetImage' => ['Bytes' => $selfie]]);
        $found = $client->searchFacesByImage($search);
        return [$match['FaceMatches'], $found['FaceMatches']];
    }
}
