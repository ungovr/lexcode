<?php
// lexcode-expect: 1
// The facade imported under its own name, in a route closure.

namespace App\Http;

use Illuminate\Support\Facades\Route;
use OpenAI\Laravel\Facades\OpenAI;

Route::post('/clips', function () {
    $video = OpenAI::videos()->create(['model' => 'sora-2', 'prompt' => request('prompt')]);
    return ['id' => $video->id];
});
