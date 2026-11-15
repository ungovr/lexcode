// lexcode-expect: 0
// A data pipeline that builds its own "input streams" from files and a config loader with stream
// parameters, in a file that imports neither cpal nor PortAudio.
pub struct Pipeline;
pub struct Config;

impl Pipeline {
    pub fn build_input_stream(&self, _path: &str) -> std::io::Result<std::fs::File> {
        std::fs::File::open("events.ndjson")
    }
}

impl Config {
    pub fn default_input_stream_params(&self, _shards: usize) -> Vec<u8> {
        Vec::new()
    }
}

pub fn ingest(p: &Pipeline, c: &Config) -> std::io::Result<()> {
    let _f = p.build_input_stream("events.ndjson")?;
    let _params = c.default_input_stream_params(4);
    Ok(())
}
