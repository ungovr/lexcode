// lexcode-expect: 3
// An app module that publishes its release to Google Play with the Gradle Play Publisher plugin:
// by plugin id, by a catalog alias named for it, and by a catalog alias named for its author.
plugins {
    id("com.android.application")
    id("com.github.triplet.play") version "3.10.1"
    alias(libs.plugins.play.publisher)
    alias(libs.plugins.triplet.play)
}

android {
    namespace = "org.example.fieldnotes"
    compileSdk = 34
}

play {
    serviceAccountCredentials.set(file("play-service-account.json"))
    track.set("internal")
}
