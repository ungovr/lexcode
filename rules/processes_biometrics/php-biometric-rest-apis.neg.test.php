<?php
// lexcode-expect: 0
// Calls to the same vendors that recognize no one: Azure Face detection (a face box and
// attributes, no identity), Face++ detection, and VoiceIt's user list. A profile photo upload
// is not this either: the definition leaves out storing an ordinary photo.
namespace App\Media;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class AvatarService
{
    public function upload($file, int $userId): string
    {
        $path = Storage::disk('s3')->putFile("avatars/$userId", $file);
        $azure = Http::withHeaders(['Ocp-Apim-Subscription-Key' => config('services.azure.face')])
            ->post(config('services.azure.endpoint') . '/face/v1.0/detect?returnFaceId=false', ['url' => Storage::url($path)]);
        $facepp = Http::asForm()->post('https://api-us.faceplusplus.com/facepp/v3/detect', ['image_url' => Storage::url($path)]);
        $users = Http::get('https://api.voiceit.io/users');
        return $path . $azure->body() . $facepp->body() . $users->body();
    }
}
