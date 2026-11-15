// lexcode-expect: 7
use diesel as dsl;
use rusqlite::{params, Connection};
use sqlx::{PgPool, Postgres, Transaction};
use uuid::Uuid;

const INSERT_VISIT: &str = "INSERT INTO visits (path, ip_address) VALUES ($1, $2)";

pub async fn insert_subscriber(
    transaction: &mut Transaction<'_, Postgres>,
    email: &str,
    name: &str,
) -> Result<Uuid, sqlx::Error> {
    let subscriber_id = Uuid::new_v4();
    let query = sqlx::query!(
        r#"
    INSERT INTO subscriptions (id, email, name, subscribed_at, status)
    VALUES ($1, $2, $3, now(), 'pending_confirmation')
            "#,
        subscriber_id,
        email,
        name,
    );
    transaction.execute(query).await?;
    Ok(subscriber_id)
}

pub async fn create_user(pool: &PgPool, username: &str, email: &str, hash: &str) -> Result<Uuid, sqlx::Error> {
    sqlx::query_scalar!(
        // language=PostgreSQL
        r#"insert into "user" (username, email, password_hash) values ($1, $2, $3) returning user_id"#,
        username,
        email,
        hash
    )
    .fetch_one(pool)
    .await
}

pub async fn change_password(pool: &PgPool, user_id: Uuid, hash: &str) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE users SET password_hash = $1 WHERE user_id = $2")
        .bind(hash)
        .bind(user_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn update_user(pool: &PgPool, email: Option<String>, bio: Option<String>, id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
            update "user"
            set email = coalesce($1, "user".email),
                bio = coalesce($2, "user".bio)
            where user_id = $3
        "#,
        email,
        bio,
        id
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn record_visit(pool: &PgPool, path: &str, ip: &str) -> Result<(), sqlx::Error> {
    sqlx::query(INSERT_VISIT).bind(path).bind(ip).execute(pool).await?;
    Ok(())
}

pub fn save_contact(conn: &Connection, name: &str, phone: &str) -> rusqlite::Result<usize> {
    conn.execute(
        "INSERT OR REPLACE INTO contacts (name, phone) VALUES (?1, ?2)",
        params![name, phone],
    )
}

pub fn set_birthday(conn: &mut dsl::PgConnection, id: i32, dob: chrono::NaiveDate) -> dsl::QueryResult<usize> {
    use dsl::RunQueryDsl;
    dsl::sql_query("UPDATE customers SET date_of_birth = $1 WHERE id = $2")
        .bind::<dsl::sql_types::Date, _>(dob)
        .bind::<dsl::sql_types::Integer, _>(id)
        .execute(conn)
}
