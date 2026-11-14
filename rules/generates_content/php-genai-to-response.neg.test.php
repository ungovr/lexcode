<?php
// lexcode-expect: 0
// Gemini output only the team reads, token counts and embeddings, content a person wrote that
// the app only formats, an app content generator, and app classes that share a short name with
// a model library's facade.

namespace App\Http\Controllers;

use App\Services\ContentGenerator;
use App\Support\Gemini;
use App\Support\Prism;
use Illuminate\Console\Command;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

// php artisan catalog:audit: a maintainer reads the model's review of the catalog in the log.
class AuditCatalog extends Command
{
    protected $signature = 'catalog:audit';

    public function handle()
    {
        $client = \Gemini::client(env('GEMINI_API_KEY'));
        $result = $client->generativeModel(model: 'gemini-2.0-flash')->generateContent('Review these product names');
        Log::info('catalog audit', ['text' => $result->text()]);
        echo $result->text() . PHP_EOL;
    }
}

class EditorController extends Controller
{
    // Counting tokens and making embeddings write nothing a person reads.
    public function measure(Request $request, $client)
    {
        $model = $client->generativeModel(model: 'gemini-2.0-flash');
        $count = $model->countTokens($request->input('body'));
        $vector = $client->embeddingModel('text-embedding-004')->embedContent($request->input('body'));
        return response()->json(['tokens' => $count->totalTokens, 'dims' => count($vector->embedding->values)]);
    }

    // Formatting what a person wrote is not generating it, and neither is the app's own template generator.
    public function preview(Request $request, ContentGenerator $generator)
    {
        $html = Str::markdown($request->input('body'));
        $page = $generator->generateContent($request->input('template'));
        return response()->json(['html' => $html, 'page' => $page]);
    }

    // An app's own classes named Gemini and Prism, in the app's namespace.
    public function own(Request $request)
    {
        $a = Gemini::generativeModel('house-style')->generateContent($request->input('q'));
        $b = Prism::structured()->using('house', 'style')->withPrompt($request->input('q'))->asStructured();
        return response()->json(['a' => $a, 'b' => $b]);
    }
}
