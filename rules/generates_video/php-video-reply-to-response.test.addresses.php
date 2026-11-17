<?php
// lexcode-expect: 8
// OpenAI's Videos API addresses written the ways apps write them, each sent back to the person:
// an id read from a request or a row (a quoted key inside the joined address), the clip with its
// variant held in a variable or followed by more of the query, and the creation address with a
// trailing slash or a query.

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class SoraAddressController extends Controller
{
    // The clip, the id joined from the request.
    public function clip(Request $request)
    {
        $clip = Http::get('https://api.openai.com/v1/videos/' . $request->input('id') . '/content');
        return response($clip->body(), 200, ['Content-Type' => 'video/mp4']);
    }

    // A remix, the id joined from a row.
    public function remix(array $row, array $body)
    {
        $job = Http::post('https://api.openai.com/v1/videos/' . $row['video_id'] . '/remix', $body);
        return response()->json($job->json());
    }

    // The clip, the id joined from a row with double quotes.
    public function clipRow(array $row)
    {
        $clip = Http::get("https://api.openai.com/v1/videos/" . $row["video_id"] . "/content");
        return response($clip->body(), 200, ['Content-Type' => 'video/mp4']);
    }

    // The clip, its variant interpolated.
    public function clipVariant(string $id, string $variant)
    {
        $clip = Http::get("https://api.openai.com/v1/videos/{$id}/content?variant={$variant}");
        return response($clip->body(), 200, ['Content-Type' => 'video/mp4']);
    }

    // The clip, its variant joined.
    public function clipVariantJoined(string $id, string $variant)
    {
        $clip = Http::get('https://api.openai.com/v1/videos/' . $id . '/content?variant=' . $variant);
        return response($clip->body(), 200, ['Content-Type' => 'video/mp4']);
    }

    // The clip, more of the query after the variant.
    public function clipVariantQuery(string $id)
    {
        $clip = Http::get("https://api.openai.com/v1/videos/{$id}/content?variant=video&attempt=1");
        return response($clip->body(), 200, ['Content-Type' => 'video/mp4']);
    }

    // Creation, the address with a trailing slash.
    public function createSlash(array $body)
    {
        return response()->json(Http::post('https://api.openai.com/v1/videos/', $body)->json());
    }

    // Creation, the address with a query.
    public function createQuery(array $body, string $team)
    {
        return response()->json(Http::post("https://api.openai.com/v1/videos?project={$team}", $body)->json());
    }
}
