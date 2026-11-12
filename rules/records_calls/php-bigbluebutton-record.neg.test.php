<?php
// lexcode-expect: 0
// BigBlueButton calls that carry a web conference without recording it: a meeting created with
// recording off, through bigbluebutton/bigbluebutton-api-php and through the HTTP API built by
// hand, and a join link. The same file also has a record key the API does not see.
namespace App\Conferencing;

use BigBlueButton\BigBlueButton;
use BigBlueButton\Parameters\CreateMeetingParameters;
use BigBlueButton\Parameters\JoinMeetingParameters;

class LiveClass
{
    public function __construct(private BigBlueButton $bbb)
    {
    }

    public function open(string $id, string $name): void
    {
        $params = new CreateMeetingParameters($id, $name);
        $params->setRecord(false);
        $params->setAllowStartStopRecording(false);
        $this->bbb->createMeeting($params);
    }

    public function join(string $id, string $user): string
    {
        return $this->bbb->getJoinMeetingURL(new JoinMeetingParameters($id, $user, 'viewer'));
    }

    public function createUrl(string $server, string $secret, string $id): string
    {
        $data = ['meetingID' => $id, 'name' => 'Office hours', 'record' => 'false'];
        $data['record'] = false;
        $query = http_build_query($data);
        return "$server/api/create?$query&checksum=" . sha1('create' . $query . $secret);
    }
}
