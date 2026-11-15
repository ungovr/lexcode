// lexcode-expect: 8
use a2::{Client as ApnsClient, DefaultNotificationBuilder, NotificationBuilder, NotificationOptions};
use twilio::{Client, OutboundCall, OutboundMessage};
use twilio as tw;
use web_push as wp;

pub async fn order_shipped(client: Client, phone: &str) {
    client
        .send_message(OutboundMessage::new("+15550000000", phone, "Your order has shipped"))
        .await
        .unwrap();
    client
        .send_message(tw::OutboundMessage::new("+15550000000", phone, "Your order is out for delivery"))
        .await
        .unwrap();
    client
        .make_call(OutboundCall::new("+15550000000", phone, "https://example.org/twiml"))
        .await
        .unwrap();
}

pub async fn sms_by_sns(sns: aws_sdk_sns::Client, phone: String) {
    sns.publish()
        .phone_number(phone)
        .message("Your table is ready")
        .send()
        .await
        .unwrap();
}

pub async fn push(info: wp::SubscriptionInfo, apns: ApnsClient, token: &str) {
    let mut builder = wp::WebPushMessageBuilder::new(&info);
    builder.set_payload(wp::ContentEncoding::Aes128Gcm, b"New reply");
    let payload = DefaultNotificationBuilder::new()
        .set_body("New reply")
        .build(token, NotificationOptions::default());
    apns.send(payload).await.unwrap();
    let message = fcm::MessageBuilder::new("server-key", token).finalize();
}

pub async fn by_http(http: reqwest::Client) {
    http.post("https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json")
        .send()
        .await
        .unwrap();
}
