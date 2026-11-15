// lexcode-expect: 0
// The image libraries' method names on the app's own types, in a file that imports no model
// library: a captcha generator, a CMS's thumbnails, a chart's image request.
use axum::extract::State;
use axum::Json;

pub struct AppState {
    pub captcha: CaptchaGenerator,
    pub cms: CmsClient,
}

pub async fn captcha(State(state): State<AppState>) -> Json<Vec<u8>> {
    let image = state.captcha.generate_image(120, 40);
    Json(image)
}

pub async fn thumbnails(State(state): State<AppState>, id: String) -> Json<Vec<String>> {
    let sizes = state.cms.images().generate(&id).await.unwrap();
    Json(sizes)
}

pub async fn chart(State(state): State<AppState>, chart: Chart) -> Json<Vec<u8>> {
    let png = chart.image_generation_request().render();
    Json(png)
}
