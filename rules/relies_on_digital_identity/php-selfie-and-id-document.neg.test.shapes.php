<?php
// lexcode-expect: 0
// A vendored SDK's service description: a list of shapes whose names are a face image and an ID
// document, each mapped to its wire type. It holds no image, and is read as the model it is by its
// 'shapes' key.

namespace App\Vendor\Identity\Data;

final class ServiceDescription
{
    public static function load(): array
    {
        return [
            'version' => '2.0',
            'metadata' => ['apiVersion' => '2024-01-01', 'protocol' => 'json'],
            'shapes' => [
                'SelfieImage' => 'Blob',
                'IdDocumentFront' => 'Blob',
                'LivenessSessionId' => 'String',
            ],
        ];
    }
}
