<?php
// lexcode-expect: 0
// Amazon Connect Voice ID calls that hold no voiceprint (listing domains, describing one),
// and an app's own VoiceIDClient in another namespace, imported, whose session and enrollment
// methods take arguments that are not Voice ID's.
namespace App\Support;

use App\Support\Calls\VoiceIDClient;

class CallerCheck
{
    public function __construct(private VoiceIDClient $sessions, private $voiceId)
    {
    }

    public function domains(): array
    {
        $list = $this->voiceId->listDomains(['MaxResults' => 10]);
        $one = $this->voiceId->describeDomain(['DomainId' => $list['DomainSummaries'][0]['DomainId']]);
        return [$list['DomainSummaries'], $one['Domain']];
    }

    public function local(string $callId): array
    {
        $score = $this->sessions->evaluateSession($callId);
        $this->sessions->startSpeakerEnrollmentJob(['caller' => $callId]);
        return [$score];
    }
}
