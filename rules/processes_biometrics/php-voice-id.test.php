<?php
// lexcode-expect: 4
// Enrolling and matching callers' voiceprints with Amazon Connect Voice ID from PHP
// (aws/aws-sdk-php): a speaker enrollment job, a fraudster registration job, and scoring a live
// call's speaker, with the client imported under an alias; and a session scored with the
// client written in full in php-voice-id.test.full.php.
namespace App\Support;

use Aws\VoiceID\VoiceIDClient as VoiceId;

class CallerVoiceprints
{
    public function __construct(private VoiceId $voiceId)
    {
    }

    public function enroll(string $domainId, string $bucket, string $role): string
    {
        $job = $this->voiceId->startSpeakerEnrollmentJob([
            'DomainId' => $domainId,
            'DataAccessRoleArn' => $role,
            'InputDataConfig' => ['S3Uri' => "s3://$bucket/enroll.json"],
            'OutputDataConfig' => ['S3Uri' => "s3://$bucket/out/"],
        ]);
        $this->voiceId->startFraudsterRegistrationJobAsync(['DomainId' => $domainId, 'DataAccessRoleArn' => $role]);
        return $job['Job']['JobId'];
    }

    public function score(string $domainId, string $sessionName, array $request): string
    {
        $result = $this->voiceId->evaluateSession(['DomainId' => $domainId, 'SessionNameOrId' => $sessionName]);
        $this->voiceId->evaluateSessionAsync($request);
        return $result['AuthenticationResult']['Decision'];
    }
}
