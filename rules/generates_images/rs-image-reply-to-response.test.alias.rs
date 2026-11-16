// lexcode-expect: 2
// The crate items the rule names, reached through `use <crate> as <alias>`.
use async_openai as oai;
use axum as ax;

pub async fn draw(client: oai::Client<oai::config::OpenAIConfig>, request: oai::types::CreateImageRequest) -> ax::Json<String> {
    let response = client.images().generate(request).await.unwrap();
    ax::Json(first_url(response))
}

pub async fn draw_legacy(client: oai::Client<oai::config::OpenAIConfig>, prompt: String) -> ax::response::Html<String> {
    let request = oai::types::CreateImageRequestArgs::default().prompt(prompt).build().unwrap();
    let response = client.images().create(request).await.unwrap();
    ax::response::Html(img_tag(response))
}
