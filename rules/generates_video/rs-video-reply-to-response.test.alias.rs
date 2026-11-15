// lexcode-expect: 2
// The crate items the rule names, reached through `use <crate> as <alias>`.
use async_openai as oai;
use axum as ax;

pub async fn start_clip(client: oai::Client<oai::config::OpenAIConfig>, prompt: String) -> ax::Json<String> {
    let request = oai::types::videos::CreateVideoRequestArgs::default().prompt(prompt).build().unwrap();
    let video = client.videos().create(request).await.unwrap();
    ax::Json(video.id)
}

pub async fn clip_bytes(client: oai::Client<oai::config::OpenAIConfig>, id: String) -> ax::body::Body {
    let clip = client.videos().download_content(&id).await.unwrap();
    ax::body::Body::from(clip)
}
