// lexcode-expect: 1
// A library that publishes to Maven Central through the mavenPublishing extension of the
// vanniktech plugin.
plugins {
    `java-library`
    id("com.vanniktech.maven.publish") version "0.30.0"
}

mavenPublishing {
    publishToMavenCentral(SonatypeHost.CENTRAL_PORTAL)
    signAllPublications()
}
