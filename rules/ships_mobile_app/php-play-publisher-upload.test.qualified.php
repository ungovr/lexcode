<?php
// lexcode-expect: 2
// The same upload with the service written fully qualified and no import, and through the
// client's older global class name.
namespace App\Console\Commands;

use Illuminate\Console\Command;

class ShipAndroid extends Command
{
    protected $signature = 'android:ship {aab}';

    public function handle(\Google\Client $client): int
    {
        $publisher = new \Google\Service\AndroidPublisher($client);
        $edit = $publisher->edits->insert('org.example.app', new \Google\Service\AndroidPublisher\AppEdit());
        $publisher->edits_bundles->upload('org.example.app', $edit->id, null, ['data' => file_get_contents($this->argument('aab')), 'uploadType' => 'media']);

        $legacy = new \Google_Service_AndroidPublisher($client);
        $legacy->edits_apks->upload('org.example.app', $edit->id, ['data' => '', 'uploadType' => 'media']);

        return self::SUCCESS;
    }
}
