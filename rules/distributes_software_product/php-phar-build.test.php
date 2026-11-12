<?php
// lexcode-expect: 5
// Building a PHAR, the single-file form a PHP program is shipped in: a compiler class that
// imports Phar, one under an alias, and one that writes it fully qualified, each filling the
// archive and setting the stub that makes it runnable.
namespace Acme\SitemapCheck\Build;

use Phar;
use Phar as Archive;

final class Compiler
{
    public function compile(string $pharFile): void
    {
        $phar = new Phar($pharFile, 0, 'sitemap-check.phar');
        $phar->startBuffering();
        $phar->buildFromDirectory(__DIR__ . '/../../src', '/\.php$/');
        $phar->setStub("#!/usr/bin/env php\n<?php Phar::mapPhar('sitemap-check.phar'); require 'phar://sitemap-check.phar/bin/sitemap-check'; __HALT_COMPILER();");
        $phar->stopBuffering();
    }

    public function compileAliased(string $pharFile): void
    {
        $archive = new Archive($pharFile);
        $archive->setDefaultStub('bin/sitemap-check');
    }

    public function compileQualified(string $pharFile, \Iterator $files): void
    {
        $phar = new \Phar($pharFile);
        $phar->buildFromIterator($files, __DIR__);
        $phar->setDefaultStub('bin/sitemap-check');
    }
}
