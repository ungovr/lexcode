<?php
// lexcode-expect: 4
// Creating a BigBlueButton web conference with recording turned on: through
// bigbluebutton/bigbluebutton-api-php with the parameters class imported and written in full,
// and through the HTTP API's create call built by hand, as an array literal and as an
// assignment that follows a setting.
namespace App\Conferencing;

use BigBlueButton\BigBlueButton;
use BigBlueButton\Parameters\CreateMeetingParameters;

class RecordedClass
{
    public function __construct(private BigBlueButton $bbb, private $settings)
    {
    }

    public function open(string $id, string $name): void
    {
        $params = new CreateMeetingParameters($id, $name);
        $params->setRecord(true);
        $params->setAutoStartRecording(true);
        $this->bbb->createMeeting($params);
    }

    public function openFull(string $id, string $name): void
    {
        $full = (new \BigBlueButton\Parameters\CreateMeetingParameters($id, $name))->setModeratorPW('m')->setRecord($this->settings->record);
        $this->bbb->createMeeting($full);
    }

    public function createUrl(string $server, string $secret, string $id): string
    {
        $data = [
            'meetingID' => $id,
            'name' => 'Council session',
            'record' => 'true',
        ];
        $query = http_build_query($data);
        return "$server/api/create?$query&checksum=" . sha1('create' . $query . $secret);
    }

    public function createData(string $id): array
    {
        $data = ['meetingID' => $id, 'name' => 'Seminar'];
        $data['record'] = $this->settings->record ? 'true' : 'false';
        return $data;
    }
}
