<?php
// lexcode-expect: 6
// OpenAI's Videos API addresses that make or return a clip, each sent back to the person: a remix
// of a finished video (a new generation), the clip with its variant named, the clip's address
// joined by concatenation, creation through Guzzle's request(), and the clip with curl.

namespace App\Http\Controllers;

use GuzzleHttp\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class SoraController extends Controller
{
    // POST /v1/videos/{id}/remix makes a new video from a finished one.
    public function remix(Request $request, string $id)
    {
        $job = Http::withToken(config('services.openai.key'))->post("https://api.openai.com/v1/videos/{$id}/remix", ['prompt' => $request->input('prompt')]);
        return response()->json($job->json());
    }

    // The clip, with its variant named.
    public function clip(string $id)
    {
        $clip = Http::withToken(config('services.openai.key'))->get("https://api.openai.com/v1/videos/$id/content?variant=video");
        return response($clip->body(), 200, ['Content-Type' => 'video/mp4']);
    }

    // The clip, its address joined by concatenation.
    public function joined(string $id)
    {
        $clip = Http::get('https://api.openai.com/v1/videos/' . $id . '/content');
        return response($clip->body(), 200, ['Content-Type' => 'video/mp4']);
    }

    // Creation through Guzzle's request().
    public function create(Request $request, Client $http)
    {
        $res = $http->request('POST', 'https://api.openai.com/v1/videos', ['json' => ['model' => 'sora-2', 'prompt' => $request->input('prompt')]]);
        return json_decode((string) $res->getBody(), true);
    }

    // The clip with curl.
    public function curlClip(string $id): void
    {
        $ch = curl_init("https://api.openai.com/v1/videos/{$id}/content");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        echo curl_exec($ch);
    }

    // The clip with curl, the address set as an option.
    public function curlClipOption(string $id): void
    {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://api.openai.com/v1/videos/' . $id . '/content');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        echo curl_exec($ch);
    }
}
