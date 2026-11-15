// lexcode-expect: 0
// The speech libraries' method names on the app's own types, in a file that imports no model
// library: a sound bank's recorded beeps, a language course's recorded lessons.
use axum::extract::State;
use axum::Json;

pub struct AppState {
    pub sounds: SoundBank,
    pub course: Course,
    pub phone: PhoneMenu,
}

pub async fn beep(State(state): State<AppState>) -> Json<Vec<u8>> {
    let clip = state.sounds.generate_speech("beep");
    Json(clip)
}

pub async fn lesson_audio(State(state): State<AppState>, id: String) -> Json<Vec<u8>> {
    let recording = state.course.audio().speech(&id).await.unwrap();
    Json(recording)
}

pub async fn menu_prompt(State(state): State<AppState>) -> Json<Vec<u8>> {
    let recording = state.phone.synthesize_speech().recorded_greeting();
    Json(recording)
}

pub async fn ringtone(State(state): State<AppState>, tone: Tone) -> Json<Vec<u8>> {
    let clip = tone.audio_generation_request().render();
    Json(clip)
}
