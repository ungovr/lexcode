// lexcode-expect: 0
// Gemini's method name on the app's own type, in a file that imports no model library: a static
// site's pages, written by people and assembled from templates.
use axum::extract::State;
use axum::response::Html;

pub struct AppState {
    pub site: SiteBuilder,
}

pub async fn about(State(state): State<AppState>) -> Html<String> {
    let page = state.site.generate_content("about");
    Html(page)
}
