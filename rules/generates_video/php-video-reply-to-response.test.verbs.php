<?php
// lexcode-expect: 2
// request() with its method not written as a quoted string, each result sent back to the person:
// Symfony's method constant for a POST to Google's Veo, and a method held in a variable for a
// call to Runway's text_to_video.

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class VeoController extends AbstractController
{
    public function __construct(private $http)
    {
    }

    // Veo on the Gemini API, the method written as Symfony's constant.
    public function veo(Request $request): JsonResponse
    {
        $res = $this->http->request(Request::METHOD_POST, 'https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-generate-001:predictLongRunning', ['json' => ['instances' => [['prompt' => $request->get('prompt')]]]]);
        return new JsonResponse($res->toArray());
    }

    // Runway, the method held in a variable.
    public function runway(Request $request, string $m = 'POST'): JsonResponse
    {
        $res = $this->http->request($m, 'https://api.runwayml.com/v1/text_to_video', ['json' => ['promptText' => $request->get('prompt')]]);
        return new JsonResponse($res->toArray());
    }
}
