<?php
// lexcode-expect: 4
// A clip a video model made, sent back to the person who asked. The facade appears through an
// aliased import and fully qualified.

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use OpenAI\Laravel\Facades\OpenAI as LLM;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;

class ClipController extends Controller
{
    // openai-php/laravel through an alias: the job the visitor polls is the JSON response.
    public function create(Request $request)
    {
        $video = LLM::videos()->create(['model' => 'sora-2', 'prompt' => $request->input('prompt'), 'seconds' => '8']);
        return response()->json(['id' => $video->id, 'status' => $video->status]);
    }

    // The same facade fully qualified, with the clip shown in a view.
    public function show(Request $request)
    {
        $video = \OpenAI\Laravel\Facades\OpenAI::videos()->create(['model' => 'sora-2', 'prompt' => $request->input('prompt')]);
        return view('clips.show', ['clip' => $video]);
    }
}

class TeaserController extends AbstractController
{
    public function __construct(private $openai)
    {
    }

    // On a client object: the finished clip's bytes are the response body.
    public function teaser(Request $request, $client): Response
    {
        $video = $client->videos()->create(['model' => 'sora-2', 'prompt' => $request->get('prompt')]);
        $content = $client->videos()->downloadContent($video->id);
        return new Response($content, 200, ['Content-Type' => 'video/mp4']);
    }

    public function status(Request $request)
    {
        $video = $this->openai->videos()->create(['model' => 'sora-2-pro', 'prompt' => $request->get('prompt')]);
        return $this->json(['id' => $video->id]);
    }
}
