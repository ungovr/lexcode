<?php
// lexcode-expect: 4
// Plain PHP with curl: the endpoint passed to curl_init, set as an option and set in an options
// array, and Veo on Vertex AI. Each prints what the video endpoint returns.

namespace App\Endpoints;

class VideoEndpoint
{
    public function create(string $prompt): void
    {
        $ch = curl_init('https://api.openai.com/v1/videos');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['model' => 'sora-2', 'prompt' => $prompt]));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $job = curl_exec($ch);
        header('Content-Type: application/json');
        echo $job;
    }

    public function animate(string $imageUrl): void
    {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://api.dev.runwayml.com/v1/image_to_video');
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['promptImage' => $imageUrl, 'model' => 'gen4_turbo']));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $task = curl_exec($ch);
        echo $task;
    }

    public function textToVideo(string $prompt): void
    {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => 'https://api.dev.runwayml.com/v1/text_to_video',
            CURLOPT_POSTFIELDS => json_encode(['promptText' => $prompt, 'model' => 'gen4_turbo']),
            CURLOPT_RETURNTRANSFER => true,
        ]);
        $task = curl_exec($ch);
        echo $task;
    }

    // Veo on Vertex AI, with the region and project in the address.
    public function vertex(string $region, string $project, string $prompt): void
    {
        $ch = curl_init("https://{$region}-aiplatform.googleapis.com/v1/projects/{$project}/locations/{$region}/publishers/google/models/veo-3.0-generate-001:predictLongRunning");
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['instances' => [['prompt' => $prompt]]]));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $operation = curl_exec($ch);
        print $operation;
    }
}
