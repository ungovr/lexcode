// lexcode-expect: 3
// A library whose publication is signed with a PGP key, which is what a public registry such as Maven
// Central requires of the artifacts it accepts: the whole publication container, one publication
// by index and one by name.
plugins {
    `java-library`
    `maven-publish`
    signing
}

publishing {
    publications {
        create<MavenPublication>("release") {
            from(components["java"])
            pom {
                name.set("geo-utils")
                url.set("https://example.org/geo-utils")
            }
        }
    }
}

signing {
    useInMemoryPgpKeys(System.getenv("SIGNING_KEY"), System.getenv("SIGNING_PASSWORD"))
    sign(publishing.publications)
    sign(publishing.publications["release"])
    sign(publishing.publications.getByName("release"))
}
