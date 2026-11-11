// lexcode-expect: 4
// A library build that publishes to Maven Central or the Gradle plugin portal: the vanniktech publish
// plugin, the Gradle Nexus publish plugin, the plugin-publish plugin, and JReleaser by catalog alias.
plugins {
    `java-library`
    id("com.vanniktech.maven.publish") version "0.30.0"
    id("io.github.gradle-nexus.publish-plugin") version "2.0.0"
    id("com.gradle.plugin-publish") version "1.2.1"
    alias(libs.plugins.jreleaser)
}

group = "org.example"
version = "2.0.1"

dependencies {
    api("com.google.guava:guava:33.2.0")
}
