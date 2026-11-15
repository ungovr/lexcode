// lexcode-expect: 4
// Hangfire background jobs that send: the static API under the import, generic, under an alias, and the injected
// IBackgroundJobClient scheduling a push for later.
using Hangfire;
using Hf = Hangfire;

namespace App.Onboarding;

public class Onboarding(IMailer mail, INotifier notifier, IBackgroundJobClient jobs)
{
    public void SignedUp(string userId, string email)
    {
        BackgroundJob.Enqueue(() => mail.SendWelcomeEmailAsync(email));
        BackgroundJob.Enqueue<IMailer>(m => m.SendReminderAsync(userId));
        Hf.BackgroundJob.Schedule(() => mail.SendDigestAsync(userId), TimeSpan.FromDays(7));
        jobs.Schedule(() => notifier.SendPushNotificationAsync(userId, "Finish setting up your account"), TimeSpan.FromDays(3));
    }
}
