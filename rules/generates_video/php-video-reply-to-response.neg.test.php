<?php
// lexcode-expect: 0
// A clip a model makes that only the team watches, footage a person shot that the app only trims
// or lists, a videos relation with a prompt column, and an app class that shares a short name
// with a model library's facade.

namespace App\Http\Controllers;

use App\Models\Course;
use App\Support\OpenAI;
use Illuminate\Console\Command;
use Illuminate\Http\Request;
use ProtoneMedia\LaravelFFMpeg\Support\FFMpeg;

// php artisan promo:draft: marketing renders a draft clip and reviews it before anything ships.
class DraftPromo extends Command
{
    protected $signature = 'promo:draft';

    public function handle()
    {
        $client = \OpenAI::client(env('OPENAI_API_KEY'));
        $video = $client->videos()->create(['model' => 'sora-2', 'prompt' => 'A slow pan over a harbor at dawn']);
        $this->info('queued ' . $video->id);
        echo $video->id . PHP_EOL;
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

    // An app's own class named OpenAI, in the app's namespace.
    public function own(Request $request)
    {
        $clip = OpenAI::videos()->create(['prompt' => $request->input('prompt')]);
        return response()->json($clip);
    }
}
