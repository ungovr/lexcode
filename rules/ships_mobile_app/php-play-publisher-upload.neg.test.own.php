<?php
// lexcode-expect: 0
// An app's own AndroidPublisher, in another namespace, that packs game assets: its asset store
// has bundles, APK-like packs and tracks of its own, and nothing reaches Google Play.
namespace App\Assets;

use App\Assets\Store\AndroidPublisher;

class TexturePacker
{
    public function __construct(private AndroidPublisher $store)
    {
    }

    public function pack(string $dir): void
    {
        $this->store->edits_bundles->upload('textures', $dir);
        $this->store->edits_apks->upload('sounds', $dir);
        $this->store->edits_tracks->update('level-1', 'textures');
    }
}
