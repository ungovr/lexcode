<?php
// lexcode-expect: 0
// The Videos API's reads, each sent straight back to the person: listing the account's videos,
// and a job's status, with Laravel's Http facade, Guzzle or Symfony HttpClient and curl. Neither
// makes or returns a clip; only creating one (POST /v1/videos, a remix, an edit or an extension)
// and downloading it (/content) count. A thumbnail of a finished job is a still, not the clip,
// and a character made for later prompts is an asset, not a clip.

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class VideoJobController extends Controller
{
    public function __construct(private $httpClient)
    {
    }

    // GET /v1/videos lists the account's videos.
    public function index()
    {
        return response()->json(Http::withToken(config('services.openai.key'))->get('https://api.openai.com/v1/videos')->json());
    }

    // GET /v1/videos/{id} reads a job's status.
    public function show(string $id)
    {
        return response()->json(Http::get("https://api.openai.com/v1/videos/{$id}")->json());
    }

    // The status through Symfony HttpClient.
    public function poll(Request $request)
    {
        $job = $this->httpClient->request('GET', "https://api.openai.com/v1/videos/{$request->get('id')}");
        return response()->json($job->toArray());
    }

    // The list through Symfony HttpClient.
    public function all()
    {
        $list = $this->httpClient->request('GET', 'https://api.openai.com/v1/videos');
        return response()->json($list->toArray());
    }

    // The status with its address joined by concatenation.
    public function status(string $id)
    {
        return response()->json(Http::get('https://api.openai.com/v1/videos/' . $id)->json());
    }

    // The thumbnail of a finished job.
    public function thumbnail(string $id)
    {
        return response(Http::get("https://api.openai.com/v1/videos/{$id}/content?variant=thumbnail")->body());
    }

    // The status with curl.
    public function curlStatus(string $id): void
    {
        $ch = curl_init("https://api.openai.com/v1/videos/{$id}");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        echo curl_exec($ch);
    }

    // The status with curl, the address set as an option.
    public function curlStatusOption(string $id): void
    {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, "https://api.openai.com/v1/videos/$id");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        echo curl_exec($ch);
    }

    // POST /v1/videos/characters makes a character asset for later prompts, not a clip.
    public function character(Request $request)
    {
        return response()->json(Http::post('https://api.openai.com/v1/videos/characters', $request->all())->json());
    }

    // A job's status, the id joined from a row.
    public function statusRow(array $row)
    {
        return response()->json(Http::get('https://api.openai.com/v1/videos/' . $row['video_id'])->json());
    }

    // The spritesheet of a finished job, the id joined from the request: a still, not the clip.
    public function spritesheet(Request $request)
    {
        return response(Http::get('https://api.openai.com/v1/videos/' . $request->input('id') . '/content?variant=spritesheet')->body());
    }

    // The thumbnail, more of the query after the variant.
    public function thumbnailQuery(string $id)
    {
        return response(Http::get("https://api.openai.com/v1/videos/{$id}/content?variant=thumbnail&attempt=1")->body());
    }

    // The list with curl, a query on the address.
    public function curlPage(string $after): void
    {
        $ch = curl_init("https://api.openai.com/v1/videos?limit=20&after={$after}");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        echo curl_exec($ch);
    }
}
