<?php
// lexcode-expect: 0
// The app's own RekognitionClient in a namespace that ends in the library's (App\Services\Aws\
// Rekognition), imported and written in full, whose compareFaces, indexFaces and searchFaces
// take arguments that are not Rekognition's. The full-name guard must not take the suffix for
// Amazon's class.
namespace App\Photos;

use App\Services\Aws\Rekognition\RekognitionClient;

class DuplicateFinder
{
    public function __construct(private RekognitionClient $lib, private \App\Services\Aws\Rekognition\RekognitionClient $mirror)
    {
    }

    public function find(string $a, string $b): array
    {
        $same = $this->lib->compareFaces($a, $b);
        $this->lib->indexFaces($a);
        return [$same, $this->mirror->searchFaces($a), $this->mirror->searchUsersByImage($b)];
    }
}
