// lexcode-expect: 3
// The build file of an Android app module in the Kotlin DSL: it applies the application plugin by
// id, by a version catalog alias and by an alias of a convention plugin, so Gradle builds an
// installable package with an application id, signing and a version code. The compose add-on next
// to it is not a second match.
plugins {
    id("com.android.application")
    alias(libs.plugins.android.application)
    alias(libs.plugins.fieldnotes.android.application)
    alias(libs.plugins.fieldnotes.android.application.compose)
    kotlin("android")
}

android {
    namespace = "org.example.fieldnotes"
    compileSdk = 34

    defaultConfig {
        applicationId = "org.example.fieldnotes"
        versionCode = 12
        versionName = "1.4.0"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
}
