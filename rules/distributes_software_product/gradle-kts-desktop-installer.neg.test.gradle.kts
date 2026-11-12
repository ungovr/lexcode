// lexcode-expect: 0
// Kotlin DSL builds that package a program without making an installer: a runnable boot jar, a
// container image with jib, a fat jar with shadow, a Compose desktop application that only runs
// (no native distributions), and installer plugin ids in a comment, a string and an apply false.
plugins {
    kotlin("jvm") version "2.0.0"
    application
    id("org.springframework.boot") version "3.3.0"
    id("com.google.cloud.tools.jib") version "3.4.3"
    id("com.github.johnrengelman.shadow") version "8.1.1"
    id("org.beryx.jlink") version "3.0.1" apply false
    alias(libs.plugins.launch4j) apply false
    alias(libs.plugins.compose)
}

// The installers are built by the release pipeline; org.beryx.jlink is applied there, not here.
val installerPlugin = "edu.sc.seis.launch4j"

compose.desktop {
    application {
        mainClass = "org.example.fieldnotes.MainKt"
        jvmArgs += listOf("-Xmx512m")
    }
}

val nativeDistributionsDir = layout.buildDirectory.dir("native-distributions")
