<?php
// lexcode-expect: 0
// A namespaced file with no import of the global Phar: `new Phar` here is App\Theme\Phar, the
// app's own class for theme packs, and so is the class imported from App\Packaging.
namespace App\Theme;

use App\Packaging\Phar as PackagingPhar;

final class ThemePack
{
    public function build(string $dir): void
    {
        $pack = new Phar($dir);
        $pack->buildFromDirectory($dir);
        $pack->setStub('theme');

        $other = new PackagingPhar($dir);
        $other->setDefaultStub('index');
    }
}
