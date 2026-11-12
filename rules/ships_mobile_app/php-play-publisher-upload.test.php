<?php
// lexcode-expect: 4
// A release tool that puts an Android build on Google Play through the Google API client's
// Play Developer service, imported under an alias: upload an app bundle and an APK into an edit,
// then point the production track at the new version code (with update, and with patch).
namespace App\Release;

use Google\Client;
use Google\Service\AndroidPublisher as Play;
use Google\Service\AndroidPublisher\Track;
use Google\Service\AndroidPublisher\TrackRelease;

class PlayRelease
{
    private Play $play;

    public function __construct(Client $client, private string $packageName)
    {
        $client->addScope(Play::ANDROIDPUBLISHER);
        $this->play = new Play($client);
    }

    public function publish(string $aabPath, string $apkPath): void
    {
        $edit = $this->play->edits->insert($this->packageName, new \Google\Service\AndroidPublisher\AppEdit());
        $bundle = $this->play->edits_bundles->upload($this->packageName, $edit->id, null, [
            'data' => file_get_contents($aabPath),
            'mimeType' => 'application/octet-stream',
            'uploadType' => 'media',
        ]);
        $this->play->edits_apks->upload($this->packageName, $edit->id, ['data' => file_get_contents($apkPath), 'uploadType' => 'media']);

        $release = new TrackRelease();
        $release->setVersionCodes([(string) $bundle->versionCode]);
        $release->setStatus('completed');
        $track = new Track();
        $track->setReleases([$release]);
        $this->play->edits_tracks->update($this->packageName, $edit->id, 'production', $track);
        $this->play->edits_tracks->patch($this->packageName, $edit->id, 'beta', $track);
        $this->play->edits->commit($this->packageName, $edit->id);
    }
}
