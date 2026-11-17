// lexcode-expect: 15
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

// The send is the `if let Err` scrutinee: the timer sends, and only its failure is logged.
pub async fn weekly(state: AppState) {
    let mut interval = tokio::time::interval(Duration::from_secs(604800));
    loop {
        interval.tick().await;
        if let Err(e) = state.mailer.send(weekly_digest()).await {
            log_failure(e);
        }
        if let Err(e) = send_weekly_newsletter().await {
            log_failure(e);
        }
    }
}

// The send is a `match` or `if let` scrutinee and the Err branch alerts the operator: the
// scrutinee's send is the timer's own (one match each), the alert in the branch is not. A send in
// the Ok arm or the else of a failure branch is the timer's own too.
pub async fn monthly(state: AppState, admin: String) {
    let mut interval = tokio::time::interval(Duration::from_secs(2592000));
    loop {
        interval.tick().await;
        match send_monthly_newsletter(&state).await {
            Ok(_) => {}
            Err(e) => send_alert_email(&admin, &e.to_string()),
        }
        if let Err(e) = state.mailer.send(monthly_digest()).await {
            send_alert_email(&admin, &e.to_string());
        }
        match run_job(&state).await {
            Err(_) => {}
            Ok(report) => send_report_email(&report),
        }
        if let Err(e) = run_job(&state).await {
            log_failure(e);
        } else {
            send_digest_email();
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

// A fallback to each recipient when a push fails is outreach, not an alert: the failure branch's
// send names the loop's item as its recipient.
pub async fn fan_out(subs: Vec<Subscriber>) {
    let mut interval = tokio::time::interval(Duration::from_secs(3600));
    loop {
        interval.tick().await;
        for s in &subs {
            match push_to(&s).await {
                Ok(_) => {}
                Err(_) => send_email(&s.email, "You have news"),
            }
            if let Err(_) = push_to(&s).await {
                send_email(&s.email, "You have news");
            }
        }
    }
}

// Not counted here: an alert per failed job in a loop over the jobs, whose recipient is the
// operator, not the loop's item, though the message names the job. It sits in this file because
// rs-send-in-loop reads any send in a `for`, so the negative fixture cannot hold it.
pub async fn nightly_jobs(jobs: Vec<Job>, admin: String) {
    let mut interval = tokio::time::interval(Duration::from_secs(86400));
    loop {
        interval.tick().await;
        for job in &jobs {
            match job.run().await {
                Ok(_) => {}
                Err(_) => send_alert_email(&admin, &job.name),
            }
            if let Err(_) = job.run().await {
                send_alert_email(&admin, &job.name);
            }
        }
    }
}
