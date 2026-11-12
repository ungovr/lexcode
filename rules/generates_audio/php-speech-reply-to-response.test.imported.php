<?php
// lexcode-expect: 3
// The facades imported under their own names, and Google Cloud Text-to-Speech in plain PHP. The
// route closure matches twice on one line (the closure's value and the response() call), which
// the record keeps as one row.

namespace App\Http;

use Illuminate\Support\Facades\Route;
use OpenAI\Laravel\Facades\OpenAI;

Route::get('/read-aloud', function () {
    $audio = OpenAI::audio()->speech(['model' => 'tts-1', 'voice' => 'alloy', 'input' => request('text')]);
    return response($audio)->header('Content-Type', 'audio/mpeg');
});

function speak_endpoint($textToSpeech, $input, $voice, $config)
{
    $response = $textToSpeech->synthesizeSpeech($input, $voice, $config);
    header('Content-Type: audio/mpeg');
    echo $response->getAudioContent();
}
