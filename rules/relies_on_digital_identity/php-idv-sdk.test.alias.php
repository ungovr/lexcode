<?php
// lexcode-expect: 1
// Onfido's API client through an aliased import.

namespace App\Identity;

use Onfido\Api\DefaultApi as OnfidoApi;

class OnfidoChecks
{
    public function client(object $config, object $http): OnfidoApi
    {
        return new OnfidoApi($http, $config);
    }
}
