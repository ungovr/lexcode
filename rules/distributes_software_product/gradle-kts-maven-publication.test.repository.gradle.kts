// lexcode-expect: 3
// A library that deploys to Sonatype: the OSSRH staging repository by uri(), Central by the maven()
// shortcut with a string, and the snapshots repository by a named url argument.
plugins {
    `java-library`
    `maven-publish`
}

publishing {
    publications {
        create<MavenPublication>("mavenJava") {
            from(components["java"])
        }
    }
    repositories {
        maven {
            name = "ossrh"
            url = uri("https://s01.oss.sonatype.org/service/local/staging/deploy/maven2/")
        }
        maven("https://central.sonatype.com/api/v1/publisher")
        maven(url = "https://oss.sonatype.org/content/repositories/snapshots/")
    }
}
