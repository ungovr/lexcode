// lexcode-expect: 5
// Hangfire recurring jobs (the static API under the import, generic, under an alias, and the injected manager) and a
// Quartz job, each sending on a schedule.
using Hangfire;
using Quartz;
using Hf = Hangfire;

namespace App.Jobs;

public static class Schedules
{
    public static void Register(IDigestSender digests, IRecurringJobManager manager, ISmsSender sms)
    {
        RecurringJob.AddOrUpdate("weekly-digest", () => digests.SendWeeklyDigestAsync(), Cron.Weekly);
        RecurringJob.AddOrUpdate<ReminderJob>("reminders", job => job.SendRemindersAsync(), Cron.Daily);
        Hf.RecurringJob.AddOrUpdate("newsletter", () => digests.SendNewsletterAsync(), "0 9 1 * *");
        manager.AddOrUpdate("sms-reminders", () => sms.SendSmsAsync("+15550100", "Pick-up day is tomorrow."), Cron.Daily);
    }
}

public class NewsletterJob(INewsletterSender sender) : JobBase, IJob
{
    public async Task Execute(IJobExecutionContext context) => await sender.SendNewsletterAsync(context.CancellationToken);
}
