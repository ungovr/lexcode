// lexcode-expect: 10
use chrono::{DateTime, NaiveDate, Utc};
use sea_orm::entity::prelude::*;
use sqlx as sq;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

// sqlx, by its full path: the email and the password hash are stored.
#[derive(Debug, Clone, sqlx::FromRow)]
pub struct UserRecord {
    pub id: Uuid,
    pub email: String,
    pub password_hash: String,
    pub created_at: DateTime<Utc>,
}

// sqlx, through a grouped use.
#[derive(FromRow)]
struct Subscriber {
    id: Uuid,
    email: String,
    status: String,
}

// sqlx, through an aliased crate.
#[derive(sq::FromRow)]
struct Visit {
    id: i64,
    ip_address: String,
}

// Diesel behind a cfg_attr, with the table name beside it.
#[derive(Clone, PartialEq, Debug, Default)]
#[cfg_attr(feature = "full", derive(Queryable, Selectable, Identifiable))]
#[cfg_attr(feature = "full", diesel(table_name = local_user))]
pub struct LocalUser {
    pub id: i32,
    #[serde(skip)]
    pub password_encrypted: Option<String>,
    pub email: Option<String>,
    pub show_nsfw: bool,
}

// Diesel behind a cfg_attr whose derive names one trait only, with an attribute on the field.
#[derive(Clone, Default)]
#[cfg_attr(feature = "full", derive(AsChangeset))]
#[cfg_attr(feature = "full", diesel(table_name = local_user))]
pub struct LocalUserUpdateForm {
    #[new(default)]
    pub email: Option<Option<String>>,
    pub theme: Option<String>,
}

// Diesel, an insert form.
#[derive(Insertable)]
#[diesel(table_name = login_token)]
pub struct LoginTokenForm {
    pub token: String,
    pub ip: Option<String>,
}

// SeaORM.
#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "customers")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub phone_number: String,
    pub date_of_birth: NaiveDate,
}

pub async fn load(pool: &PgPool) -> Vec<Subscriber> {
    Vec::new()
}
