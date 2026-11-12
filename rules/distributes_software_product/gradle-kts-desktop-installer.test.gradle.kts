// lexcode-expect: 4
// A desktop application's build in the Kotlin DSL: jlink, jpackage and a Windows executable wrapper
// (Launch4j) as plugins, one by catalog alias, and a Compose Multiplatform native distribution.
plugins {
    application
    id("org.beryx.jlink") version "3.0.1"
    id("org.panteleyev.jpackageplugin") version "1.6.0"
    alias(libs.plugins.launch4j)
}

compose.desktop {
    application {
        mainClass = "org.example.fieldnotes.MainKt"
        nativeDistributions {
            targetFormats(TargetFormat.Dmg, TargetFormat.Msi)
            packageName = "FieldNotes"
            packageVersion = "1.4.0"
        }
    }
}
