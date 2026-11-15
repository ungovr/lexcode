// lexcode-expect: 2
// Bevy's mobile entry point, which generates the Android and iOS main functions.
use bevy::prelude::*;
use bevy::window::{WindowMode, WindowPlugin};

#[bevy_main]
pub fn main() {
    App::new()
        .add_plugins(DefaultPlugins.set(WindowPlugin {
            primary_window: Some(Window { mode: WindowMode::BorderlessFullscreen(MonitorSelection::Primary), ..default() }),
            ..default()
        }))
        .run();
}

mod ios {
    #[bevy::bevy_main]
    fn start() {
        bevy::prelude::App::new().run();
    }
}
