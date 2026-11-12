<?php
// lexcode-expect: 2
// bigbluebutton/bigbluebutton-api-php with the parameters class imported under an alias, and
// written in full in a variable, turning recording on.
namespace App\Conferencing;

use BigBlueButton\Parameters\CreateMeetingParameters as CreateParams;

class Webinar
{
    public function params(string $id, string $name): array
    {
        $aliased = new CreateParams($id, $name);
        $aliased->setRecord(true);
        $full = new \BigBlueButton\Parameters\CreateMeetingParameters($id . '-q', $name);
        $full->setRecord(true);
        return [$aliased, $full];
    }
}
