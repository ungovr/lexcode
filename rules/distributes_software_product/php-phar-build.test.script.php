<?php
// lexcode-expect: 2
// A build script with no namespace, where Phar is the global class without an import.
$phar = new Phar(__DIR__ . '/build/tool.phar');
$phar->buildFromDirectory(__DIR__ . '/src');
$phar->setStub($phar->createDefaultStub('main.php'));
