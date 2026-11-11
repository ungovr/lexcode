// lexcode-expect: 6
// The same plugins reached through the build classpath, apply(), and a vanniktech catalog alias.
buildscript {
    dependencies {
        classpath("com.vanniktech:gradle-maven-publish-plugin:0.30.0")
        classpath("io.github.gradle-nexus:publish-plugin:2.0.0")
    }
}

apply(plugin = "com.vanniktech.maven.publish")

plugins {
    alias(libs.plugins.vanniktech.maven.publish)
    alias(libs.plugins.vanniktech.mavenPublish)
    alias(libs.plugins.gradle.nexus.publish)
}
