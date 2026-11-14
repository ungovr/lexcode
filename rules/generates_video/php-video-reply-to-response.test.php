<?php
// lexcode-expect: 5
// A clip a video model made, sent back to the person who asked: OpenAI's Videos API, Google's Veo
// and Runway, called with Laravel's Http facade, Guzzle and Symfony HttpClient, and Bedrock's
// Nova Reel through the AWS SDK.

namespace App\Http\Controllers;

use GuzzleHttp\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;

class ClipController extends Controller
{
    // OpenAI (Sora) through Laravel's Http facade: the job the visitor polls is the JSON response.
    public function create(Request $request)
    {
        $job = Http::withToken(config('services.openai.key'))
            ->post('https://api.openai.com/v1/videos', ['model' => 'sora-2', 'prompt' => $request->input('prompt'), 'seconds' => '8']);
        return response()->json(['id' => $job->json('id'), 'status' => $job->json('status')]);
    }

    // Runway's text_to_video, with the facade called directly; the task is shown in a view.
    public function runway(Request $request)
    {
        $task = Http::post('https://api.dev.runwayml.com/v1/text_to_video', ['promptText' => $request->input('prompt'), 'model' => 'gen4_turbo']);
        return view('clips.task', ['task' => $task->json()]);
    }

    // Google's Veo on the Gemini API through Guzzle.
    public function veo(Request $request, Client $http)
    {
        $res = $http->request('POST', "https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-generate-001:predictLongRunning", [
            'json' => ['instances' => [['prompt' => $request->input('prompt')]]],
        ]);
        return json_decode((string) $res->getBody(), true);
    }
}

class TeaserController extends AbstractController
{
    public function __construct(private $httpClient, private $bedrock)
    {
    }

    // Symfony HttpClient: the finished clip's bytes are the response body.
    public function teaser(Request $request): Response
    {
        $clip = $this->httpClient->request('GET', "https://api.openai.com/v1/videos/{$request->get('id')}/content");
        return new Response($clip->getContent(), 200, ['Content-Type' => 'video/mp4']);
    }

    // Bedrock's Nova Reel, started by id.
    public function reel(Request $request)
    {
        $job = $this->bedrock->startAsyncInvoke([
            'modelId' => 'amazon.nova-reel-v1:1',
            'modelInput' => ['taskType' => 'TEXT_VIDEO', 'textToVideoParams' => ['text' => $request->get('prompt')]],
            'outputDataConfig' => ['s3OutputDataConfig' => ['s3Uri' => 's3://clips']],
        ]);
        return $this->json(['job' => $job['invocationArn']]);
    }
}
