<?php
// lexcode-expect: 0
// Meeting-platform calls that set up or carry a meeting without recording it: a Zoom meeting
// created and its registrants listed, a Daily room created with recording off and with no
// recording setting, and a meeting-bot vendor's documentation page linked from the settings.
namespace App\Meetings;

use Illuminate\Support\Facades\Http;

class MeetingLinks
{
    public function schedule(string $token, string $topic): array
    {
        $meeting = Http::withToken($token)->post('https://api.zoom.us/v2/users/me/meetings', ['topic' => $topic, 'type' => 2]);
        $registrants = Http::withToken($token)->get("https://api.zoom.us/v2/meetings/{$meeting['id']}/registrants");
        $room = Http::withToken(config('services.daily.key'))->post('https://api.daily.co/v1/rooms', [
            'properties' => ['enable_recording' => false, 'enable_chat' => true],
        ]);
        $plain = Http::post('https://api.daily.co/v1/rooms', ['properties' => ['max_participants' => 10]]);
        return [$meeting->json(), $registrants->json(), $room->json(), $plain->json(), 'https://docs.recall.ai/docs/getting-started'];
    }
}
