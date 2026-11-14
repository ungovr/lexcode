<?php
// lexcode-expect: 2
// Amazon Rekognition reached with no import and no full class name, through the Laravel AWS
// facade and the SDK's factory: Rekognition's own request keys mark the calls.
namespace App\Kyc;

use Aws\Laravel\AwsFacade as AWS;

class FaceGate
{
    public function verify(string $id, string $selfie, string $collection, $sdk): array
    {
        $client = AWS::createClient('rekognition');
        $match = $client->compareFaces(['SourceImage' => ['Bytes' => $id], 'TargetImage' => ['Bytes' => $selfie]]);
        $known = $sdk->createRekognition()->indexFaces(['CollectionId' => $collection, 'Image' => ['Bytes' => $selfie]]);
        return [$match['FaceMatches'], $known['FaceRecords']];
    }
}
