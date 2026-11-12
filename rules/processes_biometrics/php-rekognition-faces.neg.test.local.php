<?php
// lexcode-expect: 0
// A photo library of the app's own, under the RekognitionClient short name in another
// namespace, imported and written in full. It has compareFaces, indexFaces, searchFaces,
// searchUsers and startFaceSearch methods and calls them with arguments that are not
// Rekognition's.
namespace App\Photos;

use App\Photos\Library\RekognitionClient;

class AlbumSorter
{
    public function __construct(private RekognitionClient $library, private \App\Photos\Library\RekognitionClient $backup)
    {
    }

    public function album(string $a, string $b): array
    {
        $same = $this->library->compareFaces($a, $b);
        $this->library->indexFaces(['album' => $a]);
        $found = $this->library->searchFaces($a);
        $users = $this->backup->searchUsers(['name' => $b]);
        $job = $this->backup->startFaceSearch($a);
        return [$same, $found, $users, $job];
    }
}
