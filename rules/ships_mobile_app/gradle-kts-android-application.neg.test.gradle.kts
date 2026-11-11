// lexcode-expect: 0
// Kotlin DSL files of an Android project that do not build an installable app: a library module,
// a root file that only declares the application plugin for its modules (apply false, by id and by
// catalog alias), a dynamic feature module, the add-on convention plugins that an app module applies
// next to its application plugin, and the Android Gradle plugin on the build classpath. The plugin
// id is also named in a comment and in a string.
buildscript {
    dependencies {
        classpath("com.android.tools.build:gradle:8.5.0")
    }
}

plugins {
    id("com.android.library")
    alias(libs.plugins.android.library)
    id("com.android.application") version "8.5.0" apply false
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.fieldnotes.android.application) apply false
    alias(libs.plugins.fieldnotes.android.application.compose)
    alias(libs.plugins.fieldnotes.android.application.jacoco)
    id("com.android.dynamic-feature")
}

// The app module applies com.android.application; this module is the shared sync library.
val appPluginId = "com.android.application-not-applied"

apply {
    plugin("com.android.library")
}

android {
    namespace = "org.example.fieldnotes.sync"
    compileSdk = 34
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
}
