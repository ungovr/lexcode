// lexcode-expect: 0
// Kotlin DSL files that do not publish a build to Google Play: the root file that only declares the
// plugin for its modules (apply false, by id and by alias), a module that signs and builds but does
// not upload, similarly named plugins and catalog aliases, and a comment about the plugin.
plugins {
    id("com.android.library")
    id("com.github.triplet.play") version "3.10.1" apply false
    alias(libs.plugins.play.publisher) apply false
    id("com.github.triplet.playground")
    alias(libs.plugins.play.services.oss)
    alias(libs.plugins.publisher.tools)
}

// Releases go out through the store console by hand; com.github.triplet.play is not used here.
val playPluginId = "com.github.triplet.play-not-applied"

android {
    namespace = "org.example.fieldnotes"
    compileSdk = 34

    signingConfigs {
        create("release") {
            storeFile = file(System.getenv("KEYSTORE_PATH") ?: "release.keystore")
            storePassword = System.getenv("KEYSTORE_PASSWORD")
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
}
