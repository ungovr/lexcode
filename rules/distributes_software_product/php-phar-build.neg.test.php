<?php
// lexcode-expect: 0
// Archives that ship no program: a nightly backup written with PharData (a plain tar or zip),
// and a plugin PHAR that the app opens and unpacks rather than builds. The look-alikes are an
// app's own Phar class in another namespace, and an unqualified Phar in a namespaced file with
// no import, which PHP resolves to the file's own namespace.
namespace App\Maintenance;

use Phar;
use App\Packaging\Phar as Bundle;

final class Backups
{
    public function nightly(string $storage): string
    {
        $archive = new \PharData($storage . '/backup-' . date('Ymd') . '.tar');
        $archive->buildFromDirectory($storage . '/uploads');
        $archive->compress(\Phar::GZ);

        return $archive->getPath();
    }

    public function installPlugin(string $pharPath, string $target): void
    {
        $plugin = new Phar($pharPath);
        $plugin->extractTo($target, null, true);
    }

    public function bundleTheme(string $dir): void
    {
        $bundle = new Bundle($dir);
        $bundle->buildFromDirectory($dir);
        $bundle->setStub('theme');
    }
}
