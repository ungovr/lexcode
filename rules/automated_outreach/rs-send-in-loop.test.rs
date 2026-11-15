// lexcode-expect: 15
use a2::{DefaultNotificationBuilder, NotificationBuilder};
use aws_sdk_sesv2::Client as SesClient;
use futures::StreamExt;
use lettre::{AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor};
use teloxide::prelude::*;
use twilio::{Client, OutboundMessage};
use twilio as tw;
use web_push::{SubscriptionInfo, WebPushMessageBuilder};

pub struct Subscriber {
    pub email: String,
    pub phone: String,
    pub chat_id: i64,
}

pub async fn send_newsletter(
    mailer: AsyncSmtpTransport<Tokio1Executor>,
    subscribers: Vec<Subscriber>,
) -> anyhow::Result<()> {
    for subscriber in subscribers {
        let email = Message::builder()
            .to(subscriber.email.parse()?)
            .subject("This week")
            .body(String::from("News"))?;
        mailer.send(email).await?;
    }
    Ok(())
}

pub async fn notify_followers(followers: &[Subscriber], post_url: &str) {
    for follower in followers {
        if !follower.email.is_empty() {
            send_notification_email(&follower.email, post_url);
        }
    }
    followers.iter().for_each(|f| {
        send_reminder(&f.email);
    });
}

pub async fn drain_queue(mut rows: Rows, ses: SesClient) -> anyhow::Result<()> {
    while let Some(row) = rows.next().await {
        ses.send_email()
            .from_email_address("news@example.org")
            .send()
            .await?;
        resend.emails.send(row.into_email()).await?;
        sg.send(&row.into_mail()).await?;
    }
    Ok(())
}

pub async fn text_everyone(client: Client, people: Vec<Subscriber>) {
    for person in &people {
        client
            .send_message(OutboundMessage::new("+15550000000", &person.phone, "Sale today"))
            .await
            .unwrap();
        client
            .send_message(tw::OutboundMessage::new("+15550000000", &person.phone, "Last call"))
            .await
            .unwrap();
    }
}

pub async fn push_everyone(subs: Vec<SubscriptionInfo>, tokens: Vec<String>, sns: aws_sdk_sns::Client) {
    for sub in &subs {
        let mut builder = WebPushMessageBuilder::new(sub);
        builder.set_payload(web_push::ContentEncoding::Aes128Gcm, b"hello");
    }
    for token in &tokens {
        let builder = DefaultNotificationBuilder::new().set_body("hello");
        let msg = fcm::MessageBuilder::new("key", token);
        sns.publish().phone_number(token).message("hello").send().await.unwrap();
    }
}

pub async fn post_each(http: reqwest::Client, to: Vec<String>) {
    for addr in to {
        http.post("https://api.postmarkapp.com/email")
            .json(&addr)
            .send()
            .await
            .unwrap();
    }
}

pub async fn broadcast(bot: Bot, chat_ids: Vec<ChatId>) {
    for chat in chat_ids {
        bot.send_message(chat, "We have news").await.unwrap();
    }
}

pub async fn dm_members(members: Vec<serenity::model::user::User>, http: &serenity::http::Http) {
    for member in members {
        member.direct_message(http, CreateMessage::new().content("Welcome")).await.unwrap();
    }
}
