// lexcode-expect: 0
use sqlx::PgPool;
use uuid::Uuid;

// A lookup by email: the column is read and matched, not written.
pub async fn find_user(pool: &PgPool, email: &str) -> Result<Option<Uuid>, sqlx::Error> {
    let row = sqlx::query!(
        r#"
        SELECT user_id, email, password_hash
        FROM users
        WHERE email = $1
        "#,
        email,
    )
    .fetch_optional(pool)
    .await?;
    Ok(row.map(|r| r.user_id))
}

// An update that names the email only in its WHERE clause.
pub async fn touch(pool: &PgPool, email: &str) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE users SET last_seen_at = now() WHERE email = $1")
        .bind(email)
        .execute(pool)
        .await?;
    Ok(())
}

// Content and settings rows with no personal column; a column that only starts with "email".
pub async fn publish(pool: &PgPool, id: Uuid, title: &str, body: &str) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        INSERT INTO newsletter_issues (newsletter_issue_id, title, text_content, published_at)
        VALUES ($1, $2, $3, now())
        "#,
        id,
        title,
        body
    )
    .execute(pool)
    .await?;
    sqlx::query("INSERT INTO settings (email_template, footer) VALUES ($1, $2)")
        .bind(body)
        .bind(title)
        .execute(pool)
        .await?;
    Ok(())
}

// A message about an update, not a statement.
pub fn describe(failed: bool) -> &'static str {
    if failed {
        "could not update the email address, try again"
    } else {
        "saved"
    }
}
