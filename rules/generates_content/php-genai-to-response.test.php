<?php
// lexcode-expect: 7
// Gemini and Prism structured output, whose kind the code does not fix, sent back to the person
// who asked. The facades appear through an aliased import and fully qualified.

namespace App\Http\Controllers;

use Gemini\Laravel\Facades\Gemini as Google;
use Illuminate\Http\Request;
use Prism\Prism\Facades\Prism as PrismAI;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

class StudioController extends Controller
{
    // google-gemini-php/laravel through an alias.
    public function draft(Request $request)
    {
        $result = Google::generativeModel(model: 'gemini-2.5-flash')->generateContent($request->input('brief'));
        return response()->json(['draft' => $result->text()]);
    }

    // The same facade fully qualified, with the model kept in a variable first.
    public function poster(Request $request)
    {
        $model = \Gemini\Laravel\Facades\Gemini::generativeModel(model: 'gemini-2.5-flash-image');
        $result = $model->generateContent($request->input('brief'));
        return view('studio.poster', ['parts' => $result->parts()]);
    }

    // Streamed to the browser.
    public function stream(Request $request)
    {
        $stream = Google::geminiFlash()->streamGenerateContent($request->input('brief'));
        foreach ($stream as $response) {
            echo $response->text();
        }
    }

    // Prism structured output through an alias, and fully qualified.
    public function outline(Request $request)
    {
        $response = PrismAI::structured()->using('openai', 'gpt-4o')->withSchema($this->schema())->withPrompt($request->input('topic'))->asStructured();
        return $response->structured;
    }

    public function quiz(Request $request)
    {
        $response = \Prism\Prism\Prism::structured()
            ->using('anthropic', 'claude-sonnet-4-5')
            ->withPrompt('Write a quiz about ' . $request->input('topic'))
            ->asStructured();
        return response()->json($response->structured);
    }

    private function schema()
    {
        return null;
    }
}

class AssetController extends AbstractController
{
    public function __construct(private $gemini)
    {
    }

    // google-gemini-php on a client object.
    public function caption(Request $request)
    {
        $result = $this->gemini->generativeModel(model: 'gemini-2.0-flash')->generateContent($request->get('prompt'));
        return $this->json(['caption' => $result->text()]);
    }

    public function legacy(Request $request, $client)
    {
        $result = $client->geminiPro()->generateContent($request->get('prompt'));
        return $this->render('asset/legacy.html.twig', ['text' => $result->text()]);
    }
}
