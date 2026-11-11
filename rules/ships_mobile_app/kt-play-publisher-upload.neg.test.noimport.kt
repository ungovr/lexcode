// lexcode-expect: 0
// The same call shapes on a project's own asset store, in a file with no Google Play import. The
// receiver is a qualified name, so only the vendor import can tell these from a release upload.
package demo.packaging

class Packager(private val store: demo.packaging.Store) {
    fun pack() {
        store.bundles().upload("textures", "audio")
        store.edits().bundles().upload("textures", "audio")
        store.edits().apks().upload("textures", "audio")
        store.edits().tracks().update("production", "audio")
    }
}
