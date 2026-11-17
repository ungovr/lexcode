// lexcode-expect: 0
use std::time::Duration;

use lettre::{AsyncSmtpTransport, AsyncTransport, Tokio1Executor};

// Loops that wait on what arrives and back off only after an error are servers and consumers,
// not pollers, though their callee mails someone: an accept loop (an Err arm with a block and
// without one), a loop on a stream's frames (an Err arm, an `if let Err`), a channel consumer that
// throttles and a stream drained with next().
pub async fn serve(listener: TcpListener, mailer: AsyncSmtpTransport<Tokio1Executor>) {
    loop {
        match listener.accept().await {
            Ok((s, _)) => handle_connection(s, &mailer).await,
            Err(e) => {
                warn!("accept failed: {}", e);
                tokio::time::sleep(Duration::from_millis(100)).await;
            }
        }
    }
}

async fn handle_connection(s: TcpStream, mailer: &AsyncSmtpTransport<Tokio1Executor>) {
    mailer.send(greeting(&s)).await.ok();
}

pub async fn serve_short(listener: TcpListener, mailer: AsyncSmtpTransport<Tokio1Executor>) {
    loop {
        match listener.accept().await {
            Ok((s, _)) => welcome(s, &mailer).await,
            Err(_) => tokio::time::sleep(Duration::from_millis(100)).await,
        }
    }
}

async fn welcome(s: TcpStream, mailer: &AsyncSmtpTransport<Tokio1Executor>) {
    mailer.send(greeting(&s)).await.ok();
}

pub async fn frames(conn: Conn, mailer: AsyncSmtpTransport<Tokio1Executor>) {
    loop {
        match conn.read_frame().await {
            Ok(frame) => on_frame(frame, &mailer).await,
            Err(_) => {
                tokio::time::sleep(Duration::from_millis(100)).await;
            }
        }
    }
}

async fn on_frame(f: Frame, mailer: &AsyncSmtpTransport<Tokio1Executor>) {
    mailer.send(reply_to(&f)).await.ok();
}

pub async fn frames_checked(conn: Conn, mailer: AsyncSmtpTransport<Tokio1Executor>) {
    loop {
        let res = answer_frame(conn.read_frame().await.unwrap(), &mailer).await;
        if let Err(e) = res {
            warn!("frame failed: {}", e);
            tokio::time::sleep(Duration::from_millis(100)).await;
        }
    }
}

async fn answer_frame(f: Frame, mailer: &AsyncSmtpTransport<Tokio1Executor>) -> anyhow::Result<()> {
    mailer.send(reply_to(&f)).await?;
    Ok(())
}

pub async fn consume(mut rx: Receiver<Job>, mailer: AsyncSmtpTransport<Tokio1Executor>) {
    loop {
        let job = rx.recv().await.unwrap();
        handle_job(job, &mailer).await;
        tokio::time::sleep(Duration::from_millis(100)).await;
    }
}

async fn handle_job(j: Job, mailer: &AsyncSmtpTransport<Tokio1Executor>) {
    mailer.send(job_note(&j)).await.ok();
}

pub async fn drain(mut events: EventStream, mailer: AsyncSmtpTransport<Tokio1Executor>) {
    loop {
        let ev = events.next().await;
        on_event(ev, &mailer).await;
        tokio::time::sleep(Duration::from_millis(10)).await;
    }
}

async fn on_event(ev: Option<Event>, mailer: &AsyncSmtpTransport<Tokio1Executor>) {
    mailer.send(event_note(ev)).await.ok();
}
