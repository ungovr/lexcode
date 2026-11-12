<?php
// lexcode-expect: 0
// A script with no namespace that imports the app's own Phar: the import rebinds the name, so
// `new Phar` here is App\Packaging\Phar, a theme-pack class, not PHP's archive class.
use App\Packaging\Phar;

$pack = new Phar(__DIR__ . '/themes/default');
$pack->buildFromDirectory(__DIR__ . '/themes/default');
$pack->setStub('theme');
