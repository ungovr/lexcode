// lexcode-expect: 0
// The app's own media library, in a file that imports neither async-openai nor openai-api-rs: an
// episode's audio clip with a stored transcript a person typed (the definition's exclusion) and a
// move on a timeline, and a library lookup named like openai-api-rs's call.
pub struct Episode;
pub struct Clip;
pub struct Library;

impl Episode {
    pub fn audio(&self) -> Clip {
        Clip
    }
}

impl Clip {
    pub fn transcription(&self) -> String {
        String::from("typed by the host")
    }
    pub fn translate(&self, _dx: f32, _dy: f32) {}
}

impl Library {
    pub fn audio_transcription(&self, _id: u64) -> Option<String> {
        None
    }
}

pub fn show(ep: &Episode, lib: &Library) -> Option<String> {
    let _text = ep.audio().transcription();
    ep.audio().translate(1.0, 2.0);
    lib.audio_transcription(7)
}
