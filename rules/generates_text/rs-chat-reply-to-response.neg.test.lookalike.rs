// lexcode-expect: 0
// The app's own types with the short names of the libraries' (Json, Html, GenerationRequest,
// LlamaSampler), in a file without those libraries' use lines. Model output put in them goes to
// the team's log, not to a person.
use async_openai::{config::OpenAIConfig, types::CreateChatCompletionRequest, Client};

pub struct Json<T>(pub T);
pub struct Html<T>(pub T);

pub struct GenerationRequest {
    pub topic: String,
}

impl GenerationRequest {
    pub fn new(topic: String) -> Self {
        Self { topic }
    }
}

pub struct LlamaSampler;

impl LlamaSampler {
    pub fn greedy() -> Self {
        LlamaSampler
    }
    pub fn sample(&self, pool: &[u32]) -> u32 {
        pool[0]
    }
}

pub struct ReportLog;

impl ReportLog {
    pub fn record<T>(&self, _entry: T) {}
}

pub async fn label_internally(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest, log: &ReportLog) {
    let response = client.chat().create(request).await.unwrap();
    let label = response.choices[0].message.content.clone().unwrap_or_default();
    log.record(Json(label.clone()));
    log.record(Html(label));
}

// `generate` sent with the app's own GenerationRequest, and `sample` on the app's own
// LlamaSampler, answered as a real axum response written with the full path.
pub fn seat_plan(planner: &Planner, pool: &[u32]) -> axum::Json<(String, u32)> {
    let plan = planner.generate(GenerationRequest::new("seating".to_string()));
    let seat = LlamaSampler::greedy().sample(pool);
    axum::Json((plan, seat))
}
