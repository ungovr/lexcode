<?php
// lexcode-expect: 0
// Look-alikes with no BigBlueButton in them: the app's own CreateMeetingParameters class in
// another namespace, imported and written in full, with a setRecord method of its own, and a
// record key in an array that is not a BigBlueButton create call (the file never names the
// API's meeting id parameter).
namespace App\Calendar;

use App\Calendar\Params\CreateMeetingParameters;

class Scheduler
{
    public function book(string $title, $row): array
    {
        $params = new CreateMeetingParameters($title);
        $params->setRecord(true);
        $full = new \App\Calendar\Params\CreateMeetingParameters($title);
        $full->setRecord($row->id);
        $event = ['title' => $title, 'record' => $row->id];
        $event['record'] = $row;
        return [$params, $full, $event];
    }
}
