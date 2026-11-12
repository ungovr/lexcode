<?php
// lexcode-expect: 13
// Sends inside loops over the people an app serves: Laravel's Mail facade under an aliased import,
// fully qualified and as the global alias, the Notification facade under its import, notify(),
// Symfony Mailer, PHPMailer, mail(), Twilio, Amazon SNS and named send helpers.
namespace App\Services;

use Illuminate\Support\Facades\Mail as MailFacade;
use Illuminate\Support\Facades\Notification;
use App\Mail\WeeklyDigest;
use App\Notifications\RenewalReminder;
use PHPMailer\PHPMailer\PHPMailer;
use Symfony\Component\Mime\Email;

final class DigestSender
{
    public function __construct(private MailerInterface $mailer, private Client $twilio, private SnsClient $sns)
    {
    }

    public function weekly(array $subscribers): void
    {
        foreach ($subscribers as $subscriber) {
            MailFacade::to($subscriber->email)->send(new WeeklyDigest($subscriber));
        }
    }

    public function weeklyQualified(iterable $users): void
    {
        foreach ($users as $id => $user) {
            \Illuminate\Support\Facades\Mail::to($user)
                ->queue(new WeeklyDigest($user));
            \Mail::to($user)->send(new WeeklyDigest($user));
        }
    }

    public function renewals($customers): void
    {
        $customers->each(function ($customer) {
            $customer->notify(new RenewalReminder($customer));
        });
        $customers->each(fn ($customer) => Notification::send($customer, new RenewalReminder($customer)));
    }

    public function symfony(array $members): void
    {
        foreach ($members as $member) {
            $email = (new Email())->to($member->getEmail())->subject('News')->text('This week at the library.');
            $this->mailer->send($email);
        }
    }

    public function phpMailer(array $rows): void
    {
        for ($i = 0; $i < count($rows); $i++) {
            $mail = new PHPMailer(true);
            $mail->addAddress($rows[$i]['email']);
            $mail->send();
            mail($rows[$i]['email'], 'Reminder', 'Your class starts tomorrow.');
        }
    }

    public function texts(array $patients): void
    {
        foreach ($patients as $patient) {
            $this->twilio->messages->create($patient->phone, ['from' => '+15005550006', 'body' => 'Your appointment is tomorrow.']);
            $this->twilio->calls->create($patient->phone, '+15005550006', ['url' => 'https://example.com/voice.xml']);
            $this->sns->publish(['PhoneNumber' => $patient->phone, 'Message' => 'Your appointment is tomorrow.']);
            $this->reminders->sendReminderEmail($patient);
            send_appointment_sms($patient);
        }
    }
}
