<?php
// lexcode-expect: 0
// The app's own VoiceIDClient in a namespace that ends in the library's (App\Aws\VoiceID),
// imported and written in full, whose session and enrollment methods take arguments that are
// not Voice ID's. The full-name guard must not take the suffix for Amazon's class.
namespace App\Support;

use App\Aws\VoiceID\VoiceIDClient;

class CallQueue
{
    public function __construct(private VoiceIDClient $calls, private \App\Aws\VoiceID\VoiceIDClient $backup)
    {
    }

    public function triage(string $callId): array
    {
        return [
            $this->calls->evaluateSession($callId),
            $this->calls->startSpeakerEnrollmentJob($callId),
            $this->backup->startFraudsterRegistrationJob($callId),
        ];
    }
}
