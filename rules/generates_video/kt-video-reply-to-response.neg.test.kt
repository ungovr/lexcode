// lexcode-expect: 0
// Lookalikes in a file that imports no video vendor: an in-house catalog whose method names sound like a video-model
// call, and footage a person shot that the app only serves. Each one reaches a reply sink.
package com.example.negative.video

import org.springframework.core.io.FileSystemResource
import org.springframework.core.io.Resource
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RestController
import jakarta.servlet.http.HttpServletResponse
import java.nio.file.Files
import java.nio.file.Path

interface VideoCatalog {
  fun generateVideos(id: String): String
  fun videos(): Shelf
  val models: Models
}

interface Shelf {
  fun create(id: String): String
  fun remix(id: String): String
  fun downloadContent(id: String): String
}

interface Models {
  fun lookup(id: String): String
}

interface ClipStore {
  fun path(name: String): Path
}

@RestController
class CatalogController(private val catalog: VideoCatalog, private val clips: ClipStore) {
  @GetMapping("/catalog/{id}")
  fun catalog(@PathVariable id: String): String = catalog.generateVideos(id)

  @GetMapping("/catalog/{id}/shelf")
  fun shelf(@PathVariable id: String): ResponseEntity<String> = ResponseEntity.ok(catalog.videos().create(id))

  @GetMapping("/catalog/{id}/remix")
  fun remix(@PathVariable id: String): String = catalog.videos().remix(id)

  @GetMapping("/catalog/{id}/download")
  fun download(@PathVariable id: String): String = catalog.videos().downloadContent(id)

  @GetMapping("/catalog/{id}/model")
  fun model(@PathVariable id: String): String = catalog.models.lookup(id)

  // Footage a person shot, served as it is.
  @GetMapping("/clips/{name}")
  fun clip(@PathVariable name: String): ResponseEntity<Resource> = ResponseEntity.ok(FileSystemResource(clips.path(name)))

  @GetMapping("/clips/{name}/raw")
  fun raw(@PathVariable name: String, response: HttpServletResponse) {
    Files.newInputStream(clips.path(name)).use { it.transferTo(response.outputStream) }
  }
}
