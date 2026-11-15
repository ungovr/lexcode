// lexcode-expect: 7
use std::time::Duration;

use clokwerk::{AsyncScheduler, TimeUnits};
use lettre::{AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor};
use tokio_cron_scheduler::{Job, JobScheduler};
use tokio_cron_scheduler as tcs;

pub async fn hourly_digest(mailer: AsyncSmtpTransport<Tokio1Executor>) -> anyhow::Result<()> {
    let mut interval = tokio::time::interval(Duration::from_secs(3600));
    loop {
        interval.tick().await;
        let email = Message::builder()
            .to("digest@example.org".parse()?)
            .subject("Your digest")
            .body(String::from("New posts"))?;
        mailer.send(email).await?;
    }
}

pub async fn daily_reminders(state: AppState) {
    let mut interval = tokio::time::interval(Duration::from_secs(86400));
    loop {
        interval.tick().await;
        if let Ok(due) = state.due_renewals().await {
            state.mailer.send(renewal_reminder(&due)).await.unwrap();
        }
    }
}

pub async fn schedule(sched: JobScheduler) -> anyhow::Result<()> {
    sched
        .add(Job::new_async("0 0 9 * * *", |_id, _lock| {
            Box::pin(async move {
                send_weekly_newsletter().await;
            })
        })?)
        .await?;
    sched
        .add(tcs::Job::new_async("0 0 18 * * *", |_id, _lock| {
            Box::pin(async move {
                send_reminders().await;
            })
        })?)
        .await?;
    sched
        .add(Job::new("0 0 8 * * Mon", |_id, _lock| {
            send_digest_email();
        })?)
        .await?;
    Ok(())
}

pub fn clokwerk_jobs(scheduler: &mut AsyncScheduler) {
    scheduler.every(1.day()).at("9:00 am").run(|| async {
        send_renewal_alerts().await;
    });
    scheduler.every(10.minutes()).run(|| async {
        send_push_notifications().await;
    });
}
