<?php
// lexcode-expect: 0
// Pictures a model draws that only the team sees, pictures a person made that the app only
// resizes or lists, an images relation with a prompt column, and app classes that share a short
// name with a model library's facade.

namespace App\Http\Controllers;

use App\Models\Product;
use App\Support\OpenAI;
use App\Support\Prism;
use Illuminate\Console\Command;
use Illuminate\Http\Request;
use Intervention\Image\ImageManager;

// php artisan art:drafts: a designer generates draft artwork into a local folder.
class DraftArtwork extends Command
{
    protected $signature = 'art:drafts';

    public function handle()
    {
        $client = \OpenAI::client(env('OPENAI_API_KEY'));
        $result = $client->images()->create(['model' => 'gpt-image-1', 'prompt' => 'A lighthouse at dusk, flat illustration', 'size' => '1024x1024']);
        file_put_contents(storage_path('drafts/lighthouse.png'), base64_decode($result->data[0]->b64_json));
        echo 'wrote drafts/lighthouse.png' . PHP_EOL;
        $this->info('done');
    }
}

class ThumbnailController extends Controller
{
    // Resizing a photograph a person uploaded is not generating a picture.
    public function store(Request $request, ImageManager $images)
    {
        $thumb = $images->read($request->file('photo')->getRealPath())->scale(width: 256);
        return response($thumb->toPng(), 200, ['Content-Type' => 'image/png']);
    }

    // Pictures people made, which the app only lists.
    public function index(Product $product)
    {
        return response()->json(['images' => $product->images()->pluck('url')]);
    }

    // A gallery's images relation, with a prompt column the visitor fills in: no model is called.
    public function save(Request $request, Product $product)
    {
        $image = $product->images()->create(['prompt' => $request->input('prompt'), 'path' => $request->file('image')->store('gallery')]);
        return response()->json($image);
    }

    // An app's own classes named OpenAI and Prism, in the app's namespace.
    public function own(Request $request)
    {
        $a = OpenAI::images()->create(['prompt' => $request->input('prompt')]);
        $b = Prism::image()->using('house', 'style')->withPrompt($request->input('prompt'))->generate();
        return response()->json(['a' => $a, 'b' => $b]);
    }
}
