// lexcode-expect: 0
// Kotlin DSL plugin blocks that do not publish to a public registry: java-library, application, the
// shadow and release plugins, the built-in maven-publish plugin (by id and by catalog alias), the
// registry plugins declared for the modules only (apply false), and the plugin ids in a comment or a
// string.
plugins {
    `java-library`
    application
    `maven-publish`
    id("maven-publish")
    id("com.github.johnrengelman.shadow") version "8.1.1"
    id("net.researchgate.release") version "3.0.2"
    id("org.springframework.boot") version "3.3.0"
    id("org.jetbrains.kotlin.jvm") version "2.0.0"
    alias(libs.plugins.maven.publish)
    alias(libs.plugins.shadow)
    id("com.vanniktech.maven.publish") version "0.30.0" apply false
    id("io.github.gradle-nexus.publish-plugin") version "2.0.0" apply false
    alias(libs.plugins.vanniktech.publish) apply false
    alias(libs.plugins.jreleaser) apply false
}

// Publishing goes through the company pipeline: com.vanniktech.maven.publish is not applied here.
val notAPlugin = "com.gradle.plugin-publish"
val another = "org.jreleaser"

buildscript {
    dependencies {
        classpath("com.github.johnrengelman:shadow:8.1.1")
    }
}
