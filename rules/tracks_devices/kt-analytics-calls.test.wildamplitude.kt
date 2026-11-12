// lexcode-expect: 1
// Amplitude's Kotlin SDK through a wildcard import of its package.
package demo.android

import android.content.Context
import com.amplitude.android.*

class WildAmplitude(private val context: Context) {
    private val amplitude = Amplitude(Configuration(apiKey = "key", context = context))
}
