// lexcode-expect: 0
// Publications that stay inside the company or the local machine: a publish to the team's own
// repository, to the organization's GitHub Packages and to the local Maven cache, with no signing of
// the publication. The Sonatype hosts also appear where the build reads dependencies, which publishes
// nothing, and signing is applied to a task and to a configuration, not to a publication.
plugins {
    `java-library`
    `maven-publish`
    signing
}

repositories {
    mavenCentral()
    maven("https://oss.sonatype.org/content/repositories/snapshots")
    maven {
        url = uri("https://central.sonatype.com/repository/maven-snapshots/")
    }
}

publishing {
    publications {
        create<MavenPublication>("mavenJava") {
            from(components["java"])
        }
    }
    repositories {
        maven {
            name = "corp"
            url = uri("https://nexus.corp.example.com/repository/releases")
        }
        maven {
            name = "githubPackages"
            url = uri("https://maven.pkg.github.com/acme/billing-internal")
            credentials {
                username = System.getenv("GITHUB_ACTOR")
                password = System.getenv("GITHUB_TOKEN")
            }
        }
        mavenLocal()
    }
}

signing {
    useGpgCmd()
    sign(tasks["jar"])
    sign(configurations["archives"])
}

mavenPublishing {
    publishToMavenLocal()
}

// A function of the build's own with the extension's method name, called outside the vendor extension.
fun publishToMavenCentral(version: String) = println("announcing $version")

tasks.register("announce") {
    doLast {
        publishToMavenCentral("1.0.0")
    }
}
