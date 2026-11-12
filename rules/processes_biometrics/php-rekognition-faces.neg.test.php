<?php
// lexcode-expect: 0
// Calls that sit beside Amazon Rekognition face matching and are not it. Rekognition detection
// (a face box and attributes, labels, moderation) names no person. The client is written in
// full here; the imported client is in php-rekognition-faces.neg.test.local.php, beside an app
// class of the same short name.
namespace App\Photos;

class PhotoScreening
{
    private \Aws\Rekognition\RekognitionClient $rekognition;

    public function __construct()
    {
        $this->rekognition = new \Aws\Rekognition\RekognitionClient(['region' => 'us-east-1', 'version' => 'latest']);
    }

    public function screen(string $bytes): array
    {
        $faces = $this->rekognition->detectFaces(['Image' => ['Bytes' => $bytes], 'Attributes' => ['DEFAULT']]);
        $labels = $this->rekognition->detectLabels(['Image' => ['Bytes' => $bytes], 'MaxLabels' => 10]);
        $moderation = $this->rekognition->detectModerationLabels(['Image' => ['Bytes' => $bytes]]);
        return [count($faces['FaceDetails']), $labels['Labels'], $moderation['ModerationLabels']];
    }
}
