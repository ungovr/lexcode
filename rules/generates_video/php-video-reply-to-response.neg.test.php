<?php
// lexcode-expect: 0
// A clip a model makes that only the team watches, footage a person shot that the app only trims
// or lists, a videos relation with a prompt column, a settings page that shows a video endpoint
// without calling it, and a call to the same vendor that makes no video.

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Console\Command;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use ProtoneMedia\LaravelFFMpeg\Support\FFMpeg;

// php artisan promo:draft: marketing renders a draft clip and reviews it before anything ships.
class DraftPromo extends Command
{
    protected $signature = 'promo:draft';

    public function handle()
    {
        $job = Http::withToken(env('OPENAI_API_KEY'))->post('https://api.openai.com/v1/videos', ['model' => 'sora-2', 'prompt' => 'A slow pan over a harbor at dawn']);
        $this->info('queued ' . $job->json('id'));
        echo $job->json('id') . PHP_EOL;
    }
}

class LessonController extends Controller
{
    // Trimming footage a person shot is not generating video.
    public function trim(Request $request, Course $course)
    {
        FFMpeg::fromDisk('uploads')->open($request->input('path'))->export()->toDisk('public')->save('trimmed.mp4');
        return response()->json(['path' => 'trimmed.mp4']);
    }

    // A course's videos relation, with a prompt column for a discussion question: no model is called.
    public function attach(Request $request, Course $course)
    {
        $video = $course->videos()->create(['prompt' => $request->input('question'), 'url' => $request->input('url')]);
        return response()->json($video);
    }

    // An admin page that shows the default endpoint calls nothing.
    public function settings()
    {
        return view('admin.video-settings', ['endpoint' => 'https://api.openai.com/v1/videos']);
    }

    // The same vendor, a text endpoint: no video is made.
    public function caption(Request $request)
    {
        $res = Http::withToken(config('services.openai.key'))->post('https://api.openai.com/v1/chat/completions', ['model' => 'gpt-4o-mini', 'messages' => []]);
        return $res->json();
    }
}
