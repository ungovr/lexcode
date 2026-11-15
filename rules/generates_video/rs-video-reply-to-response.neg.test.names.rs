// lexcode-expect: 0
// The video library's method names on a video host's own client, in a file that imports no model
// library: footage people uploaded, downloaded and remixed by the host.
use axum::body::Body;
use axum::extract::{Path, State};
use axum::Json;

pub struct AppState {
    pub host: VideoHostClient,
}

pub async fn download(State(state): State<AppState>, Path(id): Path<String>) -> Body {
    let footage = state.host.videos().download_content(&id).await.unwrap();
    Body::from(footage)
}

pub async fn duet(State(state): State<AppState>, Path(id): Path<String>) -> Json<String> {
    let remixed = state.host.videos().remix(&id, DuetLayout::SideBySide).await.unwrap();
    Json(remixed.id)
}
