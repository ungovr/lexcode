<?php
// lexcode-expect: 7
// A picture an image model made, sent back to the person who asked. The facades appear through
// an aliased import and fully qualified.

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use OpenAI\Laravel\Facades\OpenAI as LLM;
use Prism\Prism\Facades\Prism as PrismAI;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;

class AvatarController extends Controller
{
    // openai-php/laravel through an alias: the picture's address is the JSON response.
    public function create(Request $request)
    {
        $result = LLM::images()->create(['model' => 'dall-e-3', 'prompt' => 'Avatar of ' . $request->input('name'), 'size' => '1024x1024']);
        return response()->json(['url' => $result->data[0]->url]);
    }

    // The same facade fully qualified: a model edits the visitor's photo, stored and linked.
    public function retouch(Request $request)
    {
        $result = \OpenAI\Laravel\Facades\OpenAI::images()->edit([
            'image' => fopen($request->file('photo')->getRealPath(), 'r'),
            'prompt' => $request->input('prompt'),
            'model' => 'gpt-image-1',
        ]);
        $path = 'retouched/' . uniqid() . '.png';
        Storage::put($path, base64_decode($result->data[0]->b64_json));
        return view('retouch', ['url' => Storage::url($path)]);
    }

    // Prism through an alias, and fully qualified.
    public function poster(Request $request)
    {
        $response = PrismAI::image()->using('openai', 'dall-e-3')->withPrompt($request->input('theme'))->generate();
        return ['url' => $response->firstImage()->url];
    }

    public function cover(Request $request)
    {
        $response = \Prism\Prism\Prism::image()
            ->using('openai', 'gpt-image-1')
            ->withPrompt('Book cover for ' . $request->input('title'))
            ->generate();
        return response()->json(['cover' => $response->firstImage()->base64]);
    }
}

class PosterController extends AbstractController
{
    public function __construct(private $client, private $bedrock)
    {
    }

    // openai-php on a client object: the decoded picture is the response body.
    public function show(Request $request): Response
    {
        $result = $this->client->images()->create(['model' => 'gpt-image-1', 'prompt' => $request->get('theme')]);
        return new Response(base64_decode($result->data[0]->b64_json), 200, ['Content-Type' => 'image/png']);
    }

    // A variation of a stored picture, saved and sent as a file.
    public function variation()
    {
        $result = $this->client->images()->variation(['image' => fopen('base.png', 'r'), 'n' => 1, 'response_format' => 'b64_json']);
        $file = sys_get_temp_dir() . '/variation.png';
        file_put_contents($file, base64_decode($result->data[0]->b64_json));
        return $this->file($file);
    }

    // AWS Bedrock: an image model invoked by id.
    public function titan(Request $request)
    {
        $result = $this->bedrock->invokeModel([
            'modelId' => 'amazon.titan-image-generator-v2:0',
            'body' => json_encode(['taskType' => 'TEXT_IMAGE', 'textToImageParams' => ['text' => $request->get('prompt')]]),
        ]);
        $body = json_decode($result['body'], true);
        return $this->json(['image' => $body['images'][0]]);
    }
}
