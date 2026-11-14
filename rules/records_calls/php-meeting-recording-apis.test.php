<?php
// lexcode-expect: 7
// Recording meetings through platform APIs from PHP: reading Zoom cloud recordings (a URL
// interpolated and one concatenated), sending a Recall.ai, Meeting BaaS or Attendee notetaker
// bot into a meeting, and creating a Daily room or token that records.
namespace App\Meetings;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Http;

class MeetingArchive
{
    public function __construct(private Client $http)
    {
    }

    public function recordings(string $token, string $meetingId, string $userId): array
    {
        $one = Http::withToken($token)->get("https://api.zoom.us/v2/meetings/{$meetingId}/recordings");
        $all = $this->http->get('https://api.zoom.us/v2/users/' . $userId . '/recordings', ['query' => ['from' => '2026-01-01']]);
        return [$one->json(), json_decode($all->getBody(), true)];
    }

    public function sendBot(string $meetingUrl): array
    {
        $recall = Http::withToken(config('services.recall.key'))
            ->post('https://us-east-1.recall.ai/api/v1/bot/', ['meeting_url' => $meetingUrl, 'bot_name' => 'Notetaker']);
        $baas = Http::post('https://api.meetingbaas.com/bots', ['meeting_url' => $meetingUrl]);
        $attendee = Http::post('https://app.attendee.dev/api/v1/bots', ['meeting_url' => $meetingUrl]);
        return [$recall->json(), $baas->json(), $attendee->json()];
    }

    public function dailyRoom(): array
    {
        $room = Http::withToken(config('services.daily.key'))->post('https://api.daily.co/v1/rooms', [
            'properties' => ['enable_recording' => 'cloud'],
        ]);
        $token = Http::post('https://api.daily.co/v1/meeting-tokens', [
            'properties' => ["enable_recording" => "raw-tracks", 'room_name' => $room['name']],
        ]);
        return [$room->json(), $token->json()];
    }
}
