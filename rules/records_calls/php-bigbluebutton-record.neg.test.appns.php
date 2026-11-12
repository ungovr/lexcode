<?php
// lexcode-expect: 0
// The app's own CreateMeetingParameters in a namespace that ends in the library's
// (App\Vendor\BigBlueButton\Parameters), imported and written in full, with a setRecord method
// of its own. The full-name guard must not take the suffix for the library's class.
namespace App\Calendar;

use App\Vendor\BigBlueButton\Parameters\CreateMeetingParameters;

class RoomBooking
{
    public function book(string $title): array
    {
        $params = new CreateMeetingParameters($title);
        $params->setRecord(true);
        $full = new \App\Vendor\BigBlueButton\Parameters\CreateMeetingParameters($title);
        $full->setRecord(true);
        return [$params, $full];
    }
}
