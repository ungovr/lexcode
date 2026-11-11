// lexcode-expect: 3
// The plugin reached the older ways: apply(), an apply block, and the plugin's artifact on the
// build classpath.
buildscript {
    dependencies {
        classpath("com.github.triplet.gradle:play-publisher:3.10.1")
    }
}

apply(plugin = "com.github.triplet.play")

apply {
    plugin("com.github.triplet.play")
}
