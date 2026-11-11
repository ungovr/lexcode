// lexcode-expect: 3
// An Android app module that applies the plugin the older way, with apply(), in a block, and with a
// version and no apply false (the plugin is then applied to this project).
plugins {
    id("com.android.application") version "8.5.0"
}

apply(plugin = "com.android.application")

apply {
    plugin("com.android.application")
}

android {
    namespace = "org.example.fieldnotes"
    compileSdk = 34
}
