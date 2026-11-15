// lexcode-expect: 0
use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

// The app's own sender address in its settings file: read from configuration, not a stored row.
#[derive(Deserialize, Clone)]
pub struct EmailClientSettings {
    pub base_url: String,
    pub sender_email: String,
    pub timeout_milliseconds: u64,
}

// A request body: deserialized, never declared as a database row.
#[derive(Deserialize)]
struct LoginBody {
    email: String,
    password: String,
}

// An anonymous total that can no longer be tied to anyone.
#[derive(FromRow, Serialize)]
pub struct DailySignups {
    pub day: NaiveDate,
    pub signups: i64,
    pub unsubscribes: i64,
}

// Flags about a person's email are not the email.
#[derive(FromRow)]
pub struct NotificationPrefs {
    pub id: i32,
    pub email_verified: bool,
    pub send_notifications_to_email: bool,
}

// Which channels a notification goes out on: a switch named for the channel, not an address.
#[derive(Queryable, Insertable)]
pub struct NotificationChannels {
    pub id: i32,
    pub email: bool,
    pub push: bool,
}

// The app's own trait of the same short name as Diesel's derive, implemented by hand.
pub trait Queryable {
    fn describe(&self) -> String;
}

pub struct Report {
    pub email: String,
}

impl Queryable for Report {
    fn describe(&self) -> String {
        self.email.clone()
    }
}
